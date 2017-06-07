```
回顾：
1.linux内核platform机制
  虚拟总线：platform_bus_type
  两个链表：dev,drv
  两个数据结构：
  	   struct platform_device
  	   	.name
  	   	.id
  	   	.resource
  	   	.num_resources
  	   platform_device_register
  	   platform_device_unregister
  	   
  	   struct platform_driver
  	   	.driver
  	   		.name
  	        .probe
  	        .remove
  	   platform_driver_register
  	   platform_driver_unregister
  	   platform_get_resource

2.I2C总线
  面试题：谈谈对I2C的理解
  2.1.I2C总线功能
  通信方式：
  	GPIO
  	UART
  	I2C总线
  2.2.I2C定义
  两线式串行总线
  SDA
  SCL
  上拉电阻
  画出简要的连接示意图
  2.3.三个问题
  CPU如何定位到要访问的外设？
  CPU如何通过两根信号线和外设通信？
  SCL和SDA如何搭配使用？
  答案：I2C传输协议中,确切在外设的芯片手册中！
  2.4.I2C总线协议相关内容
  1.概念：
  START
  STOP
  画图START和STOP时序图
  设备地址
  	以LM77/AT24C02和ADP8860为例
  R/W
  ACK
  总结：可以回答第一个问题
  
  2.回答第二个问题
  以LM77为例
  以AT24C02为例(建议),选择读或者写为例
  以HMC6352为例
  选择一个即可
  随机读取AT240C2任意片内地址存储空间的数据为例,边说边画图(框框圈圈)
  
  3.回答第三个问题
  低放高取
  以HMC6352进入休眠模式为例,画出具体的操作时序图
  已知设备地址=0x21,发送'S'=0x53
  
  总结：I2C外设的操作一定要严格按照芯片手册的时序进行
  
2.linux内核I2C驱动实现过程
  2.1.明确实现I2C驱动方法：
  方法1：采用GPIO模拟I2C时序
         将I2C涉及的两个管脚不再作为SDA和SCL专有IO口
         而是配制成普通的INPUT/OUPUT,驱动必须自己
         拉高拉低造I2C外设要求的时序
         效率极其低下
  方法2：采用I2C控制器进行访问
         将I2C涉及的两个管脚不再作为INPUT、OUTPUT而是配置成
         专有SDA和SCL,将来驱动只需访问I2C控制器对应的寄存器
         即可,将来I2C控制器帮你发起I2C外设要求的时序
  方法3: 采用linux内核I2C驱动框架来实现
 
  2.2.linux内核I2C驱动框架
      1.本质还是基于方法2实现,比方法2高级而已！
      2.linux内核I2C驱动的分层
      以CPU向AT24C02片内地址0x10写入数据0x55为例：
      掌握数据流的走向！
      
      应用层：
      	     struct at24c02_data {
      	     	unsigned char addr; //片内地址
      	     	unsigned char data; //片内数据
      	     };
      	     struct at24c02_data cmd;
      	     cmd.addr=0x10;
      	     cmd.data=0x55;
      	     //将要操作的数据丢给驱动
      	     ioctl(fd, AT24C02_WRITE, &cmd);
      ---------------------------------------------------
      I2C设备驱动层：
      	     职能：用来和用户进行“数据”的交互,此"数据"仅仅
      	     	   对于外设是有意义的！
      	     跟应用层交互,同样跟I2C总线驱动层交互！
      	     操作的硬件对象是I2C外设本身！
      	     
      	     long at24c02_ioctl(...){
      	        //1.定义内核缓冲区
      	     	struct at24c02_data kcmd;
      	     	//2.拷贝用户缓冲区数据到内核
      	     	copy_from_user(&kcmd, 
      	     		(struct at24c02_data *)arg,,
      	     			sizeof(kcmd));
      	     	//kcmd.addr = 0x10;
      	     	//kcmd.data = 0x55;
      	     	//3.调用内核提供的SMBUS层的函数最终将
      	     	这些数据丢给I2C总线驱动层		
      	     }
      --------------------------------------------------	     	    
      SMBUS接口层：
      		内核提供的一堆函数而已
      		连接I2C设备驱动层和I2C总线驱动层
      		addr = 0x10;
      		data = 0x55;
      --------------------------------------------------
      I2C总线驱动层：
      		职能：最终操作I2C控制器(软件操作寄存器)
      		      启动硬件的传输时序,将I2C设备驱动层
      		      发送过来的数据丢给SDA发送给外设
      		操作硬件仅仅是I2C控制器！
      		addr = 0x10;
      		data = 0x55;
      		发起硬件时序：
      		START->写设备地址->ACK->0x10->ACK->0x55->ACK->STOP      
      --------------------------------------------------
      硬件层:
      	       I2C控制器<===>SDA/SCL<=====>AT24C02
      
      总结：实现一个I2C驱动的步骤：
      0.编写好应用层
      1.编写好I2C设备驱动
        将来编写I2C驱动主要围绕着I2C设备驱动展开    
      2.编写好I2C总线驱动
        不用编写,此代码由芯片公司写好,只需配置内核将
        I2C总线驱动编译到内核中即可(zImage)
        cd /opt/kernel
        make menuconfig
        Device Drivers->
        	I2C supports->
        		I2C hardware bus supports->
        			//S5PV210的I2C总线驱动
        			<*> s3c2410 i2c driver
        			
      3.SMBUS接口层有内核实现,I2C设备驱动调用
      4.硬件层由硬件工程师实现

3.linux内核I2C设备驱动实现过程
  3.1.同样采用内核的分离思想
  3.2.明确：platform机制适用于任何硬件
  3.3.具体分离思想的实现过程如下：
  1.首先内核已经定义好了一个虚拟总线,叫i2c_bus_type
  2.在这个总线上维护这两个链表:dev链表和drv链表
  3.dev链表上每一个节点保存I2C外设的硬件信息,节点对应的
  数据结构为struct i2c_client,每当向dev链表添加一个I2C
  外设的硬件信息时,驱动开发者只需用此数据结构定义一个对象
  然后初始化这个对象,但必须要初始化其中的name字段,将来
  用于匹配,一旦初始化完毕,将硬件节点对象添加到dev链表,
  内核会帮你遍历drv链表,取出drv链表上每一个软件节点跟
  这个硬件节点进行匹配(内核通过调用总线的match函数,比较硬件节点的
  name和软件节点的id_table的name),如果匹配成功,内核调用
  软件节点的probe函数,同时把匹配成功的硬件节点的首地址传递
  给probe函数,如果没有匹配成功,没关系,硬件节点静静等待软件节点的
  到来！
  4.drv链表上每一个节点保存I2C外设的软件信息,节点对应的
  数据结构为struct i2c_driver,每当向drv链表添加一个I2C
  外设的软件信息时,驱动开发者只需用此数据结构定义一个对象
  然后初始化这个对象,但必须要初始化其中的id_table的name字段,将来
  用于匹配,一旦初始化完毕,将软件节点对象添加到drv链表,
  内核会帮你遍历dev链表,取出dev链表上每一个硬件节点跟
  这个软件节点进行匹配(内核通过调用总线的match函数,比较硬件节点的
  name和软件节点的id_table的name),如果匹配成功,内核调用
  软件节点的probe函数,同时把匹配成功的硬件节点的首地址传递
  给probe函数,如果没有匹配成功,没关系,软件节点静静等待硬件节点的
  到来！
  5.probe函数是否被调用至关重要,预示着I2C设备驱动的完整性
  
  结论：驱动开发者只需围绕着两个数据结构展开工作即可：
  struct i2c_client
  struct i2c_driver
  
4.struct i2c_client数据结构的使用
  struct i2c_client {
  	unsigned short addr;//I2C外设的设备地址
  	char name[I2C_NAME_SIZE];//用于匹配
  	int irq;//I2C外设的中断号
  	...
  };//描述I2C外设的硬件信息
  切记：addr和name字段必须要初始化！
  addr将来用于CPU找外设！
  name将来用于匹配！
  
  传统的编程步骤：
  1.定义初始化硬件节点对象
  2.添加硬件节点到dev链表
  3.删除硬件节点
  
  注意：驱动开发者不会直接对i2c_client进行定义初始化和注册,卸载
  只需利用struct i2c_board_info间接对i2c_client进行操作！
  
  struct i2c_board_info {
  	char	type[I2C_NAME_SIZE];
  	unsigned short	addr;
  	int		irq;
  	...
  };
  作用：驱动开发者用此数据结构来描述I2C外设的硬件信息
        将来内核根据驱动开发者注册的I2C外设硬件信息,内核
        会帮驱动开发者定义初始化和注册,删除i2c_client
  type:将来这个字段会赋值给i2c_client的name,用于匹配
  addr:将来这个字段会赋值给i2c_client的addr,用于找设备
  irq:将来这个字段会赋值给i2c_client的irq
  
  总结：驱动开发者对i2c_board_info的操作其实就是对
        i2c_client的操作
        当然：
        i2c_board_info中的addr和type也必须初始化！

案例：TPAD开发板上有AT24C02存储器,编写AT24C02的设备驱动
      思路：
      首先搞定AT24C02的硬件节点对象
      
      AT24C02存储器特点：
      1.采用I2C接口
      2.属于EEPROM(电可擦除存储器)的一种
      3.写之前不用手动擦除,硬件会自动擦除
      4.容量256字节
      5.片内地址编址：0x00~0xFF
      6.TPAD上对应的设备地址=0x50      
  
      具体的实施步骤：
      1.切记：i2c_client无需直接定义初始化和注册,
              需要i2c_board_info描述硬件信息即可
              
      2.切记：i2c_board_info的操作只能静态编译到内核代码中
              不能insmod和rmmod,i2c_board_info定义初始化和
              注册必须放在平台代码中完成！
              
      3.平台代码中添加at24c02的硬件信息
        cd /opt/kernel
        //打开平台代码
        vim arch/arm/mach-s5pv210/mach-cw210.c 在头文件后添加一下语句：
        //定义初始化AT24C02的硬件信息
	static struct i2c_board_info at24c02[] = {
		{
			I2C_BOARD_INFO("at24c02", 0x50)
		}
	};
	//"at24c02"将来用于匹配,会赋值给i2c_client.name
	//0x50表示设备地址,会赋值给i2c_client.addr
        
        //注册硬件信息到内核
        找到smdkc110_machine_init函数,在此函数中调用一下函数
        即可完成硬件信息的注册：
        int i2c_register_board_info(int busnum,
        	 struct i2c_board_info const *info,
        			unsigned len)
        函数功能：注册硬件信息到内核
        busnum:I2C外设所在的总线编号,通过看原路图获取
        	I2C外设的总线编号,TPAD的AT24C02对应的
        	总线编号为：0
        info:指向硬件信息
        len:硬件信息的个数
        
        总结：在smdkc110_machine_init函数调用：
        i2c_register_board_info(0, at24c02, ARRAY_SIZE(at24c02));
        
        保存退出
        
       4.编译内核代码
         make zImage
         cp arch/arm/boot/zImage /tftpboot
         至此：zImage就已经支持了AT24C02的硬件信息
         用新zImage重启开发板   

5.struct i2c_driver
  struct i2c_driver {
  	const struct i2c_device_id *id_table;
  	int (*probe)(struct i2c_client *client, 
  			const struct i2c_device_id *id);
	int (*remove)(struct i2c_client *client);
	
  };    
  作用：描述I2C外设的软件信息
  id_table:其中的name用于匹配,必须初始化
  	static const struct i2c_device_id at24_id[] = {
		{ "at24c02", 0 },
	};//"at24c02"将来用于匹配
	初始化：
	id_table = at24_id
	
  probe:匹配成功,内核调用,形参client指针指向匹配成功的
        硬件信息,获取设备地址:client->addr
        形参id和id_table指向同样内存区域(此形参无需关注)
  remove：卸载软件节点,内核调用此函数,形参client指针指向匹配成功的
        硬件信息,获取设备地址:client->addr
          硬件信息无法卸载,原因是硬件信息和zImage编译在一起
  
  配套函数：
  i2c_add_driver(&软件节点对象);  //注册        			
  i2c_del_driver(&软件节点对象);  //卸载

案例：TPAD开发板上有AT24C02存储器,编写AT24C02的设备驱动
      思路：
      首先搞定AT24C02的硬件节点对象(搞定)
      最后搞定AT24C02的软件节点对象
实施步骤：
1.根据上一个案例将AT24C02的硬件信息代码添加到
  平台代码中
2.编写AT24C02的软件信息的代码
  从ftp://DRV/下载AT24C02参考驱动at24c02.rar
  解压缩：
  at24c02_1
  at24c02_2
3.首先分析at24c02_1目录的源码
  mkdir /opt/drivers/day11
  cp at240c2_1 /opt/drivers/day11
  cd /opt/drivers/day11/at24c02_1/
  在probe函数中将设备地址打印出来！
  	printk("%s: device address = %#x\n",
  			__func__, client->addr);
  make
  cp at24c02_drv.ko /opt/rootfs
  开发板测试：
  insmod at24c02_drv.ko //查看打印信息
  rmmod at24c02_drv

4.最后分析at24c02_2目录的源码
  cp at240c2_2 /opt/drivers/day11
  cd /opt/drivers/day11/at24c02_2/
  make
  cp at24c02_drv.ko /opt/rootfs  
  arm-linux-gcc -o at24c02_test at24c02_test.c
  cp at24c02_test /opt/rootfs
  
  ARM测试：
  insmod at24c02_drv.ko
  ./at24c02_test
  
6.SMBUS接口层相关函数的使用
  切记：SMBUS接口层作用连接I2C设备驱动和I2C总线驱动
        前者负责数据的处理,后者负责数据的硬件传输
  使用步骤：
  1.打开SMBUS接口层的内核说明文档
    cd /opt/kernel
    vim Documentation\i2c\smbus-protocol 
  2.打开I2C外设的芯片手册,例如AT24C02找到相关的读写时序图
  3.根据硬件操作时序图在SMBUS接口函数中找到对应的函数：
    例如AT24C02的按字节写(把'S'写片内地址0x00)
    找到此函数i2c_smbus_write_byte_data,文档说：
    此函数将来发起的硬件时序：
    S Addr Wr [A] Comm [A] Data [A] P完全符合芯片手册的
    时序要求
  4.复制函数名,利用sourceinsight在内核源码中找到
    函数的定义,一个一个传参即可
    s32 i2c_smbus_write_byte_data(
	struct i2c_client *client, //传递匹配成功的硬件信息
		u8 command,//片内地址 
		u8 value)         //片内数据
		
    
```