```
回顾：
1.linux内核程序编程框架
  1.1.linux系统分用户空间和内核空间
  1.2.编程框架

**********************************************************
2.linux内核GPIO操作库函数
  2.1.明确：
  GPIO操作：对CPU的某个管脚进行输入和输出的操作
            操作步骤：
            1.先配置为输入或者输出
            2.如果输入口,就可以进行获取管脚的电平状态
            3.如果输出口,就可以进行设置管脚的电平状态
  库函数：说明这些函数由内核实现,便于调用
  回顾：ARM裸板GPIO操作的软件编程步骤：
  伪操作：
  配置寄存器 &= ~(位操作);
  配置寄存器 |= (位操作); //输入或者输出
  
  获取电平状态：
  status = 数据寄存器;
  
  设置电平状态：
  数据寄存器 = 1/0;
  
  总结：内核的GPIO操作库函数无非就是把软件编程的底层操作进行
  封装而已！
  
  2.2.linux内核GPIO操作库函数：
  注意：内核编程涉及的内核函数,不好意思,没有UC中的man手册
  可以利用sourceinsight和内核源码找到函数的定义,甚至在内核
  源码中搜索别人如何使用这个函数,咱们只需照猫画虎用即可！
  提示：sourceinsight直接搜索即可
        ctags使用grep搜索匹配的字符串
        cd /opt/kernel
        grep "gpio_request" * -Rn
        vim 匹配的文件 //观察别人如何使用
            ctrl + ] //找到此函数的定义
            
  1.int gpio_request(unsigned gpio, const char *label)
    函数功能：
    切记：CPU的任何一个GPIO硬件资源对于内核来说都是一种
    宝贵的资源,内核程序要想访问某个GPIO硬件,必须先向内核
    去申请(类似分配内存使用malloc)
    
    参数：
    gpio:对于CPU的任何一个GPIO硬件资源,在内核中都有唯一的
         一个软件编号,本质就是数字(类似身份证号),这个参数只需指定这个GPIO
         硬件资源对应的GPIO编号即可;
         例如：
         硬件GPIO      软件编号(宏)
         GPC0_3	       S5PV210_GPC0(3)
         GPC0_4	       S5PV210_GPC0(4)
         GPC1_3	       S5PV210_GPC1(3)
         GPC1_4	       S5PV210_GPC1(0)
         ....
    	 GPH0_0	       S5PV210_GPH0(0)
    label:申请的GPIO硬件资源在内核中给定一个名称而已
          随便给！
    返回值：只需看内核源码的大神们怎么写,怎么判断即可
          	 
  2.void gpio_free(unsigned gpio)
    函数功能：硬件GPIO不再使用时,记得要将这个资源归还给内核
              类似释放内存free
    参数：
    gpio:GPIO硬件资源对应的软件编号
    
  3.int gpio_direction_output(unsigned gpio, int value)
    函数功能：配置硬件GPIO为输出口,同时输出value值
    
  
  4.int gpio_direction_input(unsigned gpio)
    配置GPIO为输入口
    
  5.void gpio_set_value(unsigned gpio, int value)
    设置GPIO的状态,状态由value决定,此函数使用的前提
    是GPIO先配置为输出口
    
  6.int gpio_get_value(unsigned gpio)
    获取GPIO的状态,此函数返回值就是GPIO的状态
    此函数对GPIO到底是输入还是输出无要求！

  注意：头文件只需看内核源码大神的代码头文件,可以把大神代码的
  头文件直接拷贝过来使用即可
  #include <asm/gpio.h>
  #include <plat/gpio-cfg.h>
  
案例：编写LED设备驱动,实现加载驱动开灯,卸载驱动关灯
实施步骤：
1.mkdir /opt/drivers/day02/1.0 -p
2.cd /opt/drivers/day02/1.0
3.vim led_drv.c
4.vim Makefile
5.make
6.cp led_drv.ko /opt/rootfs

ARM执行：
1.insmod led_drv.ko 
2.rmmod led_drv   

掌握C语言结构体的标记初始化方式：
struct stdu {
	int a;
	int b;
	int c;
	int d;
	int e;
};
传统初始化方式：
struct stdu A = {1,2,3,4,5};//必须按照顺序并且全部初始化
标记初始化：
struct stdu A = {
	.c = 3,
	.e = 5,
	.d = 4
};//无需全部初始化,不用按照顺序

切记：内核编程一定要多利用面向对象编程思想！

3.linux内核系统调用实现原理(了解)
  面试题：对系统调用的认识
  3.1.回顾：UC学过的系统调用函数：open,close,read,write,fork,exit,mmap,brk,sbrk等
  3.2.系统调用作用：实现用户空间和内核空间进行通信,数据的交互
  3.3.明确：应用程序调用的系统调用函数的定义在C库中！不是在内核定义
  3.4.系统调用函数的实现过程：以write函数为例
  1.首先应用程序调用系统调用函数write
  2.会跑到C库的write函数定义,C库的write做两件事：
    1.保存write函数对应的系统调用号到R7寄存器
      系统调用号：内核给每一个系统调用函数给指定了一个软件编号
                  类似身份证号,定义在内核源码的：
                  arch/arm/include/asm/unistd.h
                  #define __NR_write 4
                  
    2.调用svc指令触发软中断异常,也就伴随着CPU开始处理
      软中断异常,也就伴随着CPU工作模式的切换(USER->SVC)
  
  3.CPU开启处理软中断的过程
    硬件处理
    	...
    软件处理
    	注意：linux系统中的异常向量表代码由内核来实现
    	也就代表着应用程序利用write系统调用函数切换"陷入"
    	内核中,跑到内核对应的异常向量表的软中断处理入口
  4.用户应用(进程)切换到内核,跑到内核软中断的处理入口以后
    同样做两件事：
    0.保护现场
    1.从R7寄存器取出之前保存的write系统调用号(4)
    2.在以系统调用号4为索引(下标)在内核事先定义好的一个
      系统调用表中找到对应的一个内核函数sys_write，找到以后
      执行内核函数sys_write,此函数由内核已经编写好！
      
      系统调用表：俗称系统调用数组,此数组中每一个元素保存的
      		  是一个函数地址,定义在内核源码的：
      		  arch/arm/kernel/calls.S
  5.内核对应的函数sys_write调用完毕,恢复现场,也就代表着软中断异常处理
    正式结束,原路返回到用户应用程序,也就代表着write函数调用
    结束

案例：利用汇编了解write函数的定义
注意：编译时采用静态方式编译,能够看到write函数定义的内容

***********************************************************
4.linux内核设备驱动相关内容
  4.1.设备驱动定义
  设备驱动必须包括两大职能： 
  1.操作硬件(操作外设相关寄存器)
  2.给用户(应用程序)提供操作硬件的访问接口(函数)
  
  4.2.linux内核设备驱动的分类
  前提：按照硬件的操作特性
  1.字符设备驱动
  	特点：字符设备驱动访问的硬件又称字符设备,字符设备
  	访问时按照字节流形式访问;
  	例子：键盘,鼠标,LED,UART(BT,GPS,GPRS),LCD,触摸屏(X,Y),
  	      声卡,摄像头,各种传感器(重力传感器,距离传感器,
  	      温度传感器等)
  	
  2.块设备驱动
  	特点：操作时不再按照字节流访问,而是按照一定的数据块
  	进行访问操作,数据块512字节,1KB字节,4K字节等
  	例子：硬盘,U盘,SD卡,TF卡,Nand,Nor
  	这些驱动内核支持的很完美！
  	
  3.网络设备驱动
  	特点：又称网卡驱动,一般要在访问操作时要符合TCP/IP网络协议栈的协议
  	要求(各种数据格式),要对协议有一定的了解
  	例子：有线网卡,无线网卡,交换芯片
  	这些驱动一般都是有芯片厂家提供

5.linux内核字符设备驱动相关内容
  5.1.明确linux/unix理念：一切皆文件
  “一切”：就是指计算机系统中的硬件外设
  "文件"：很抽象,说到文件,文件就是硬件,硬件就是文件
  例如：向文件写入"helloworld",本质上就是向文件代表的外设硬盘
  写入数据
  总结：在linux系统下,只要是个设备,都有对应的文件
  
  5.2.字符设备文件,块设备文件
  字符设备文件对应的硬件就是字符设备
  块设备文件对应的硬件就是块设备
  但是除了网络设备,无设备文件,通过socket进行访问操作
  
  5.3.设备文件特性：
  1.设备文件只能存在于根文件系统的必要目录dev下
  2.明确：设备文件就是硬件,访问设备文件,本质就是访问硬件本身
          用户软件访问设备文件必须通过系统调用函数进行访问
          并且访问时必须先open！
          
    例如：S5PV210的4个UART对应的设备文件
    开发板执行：
    cd /dev/
    ls s3c2410_serial* -lh
    crw-rw----   204,  64    s3c2410_serial0
    crw-rw----   204,  65    s3c2410_serial1
    crw-rw----   204,  66    s3c2410_serial2
    crw-rw----   204,  67    s3c2410_serial3
    说明：
    c:表示此设备为字符设备,b:块设备
    204:表示此设备对应的主设备号
    64,65,66,67:表示此设备对应的次设备号
    s3c2410_serial0：表示第一个串口对应的设备文件名
    s3c2410_serial1：表示第二个串口对应的设备文件名
    s3c2410_serial2：表示第三个串口对应的设备文件名
    s3c2410_serial3：表示第四个串口对应的设备文件名	
    
    应用程序访问第一个串口：
    int fd;
    
    //打开一个串口
    fd = open("/dev/s3c2410_serial0", O_RDWR);
    
    //读串口
    read(fd, buf, size);
    
    //写串口
    write(fd, buf, size);
    
    //关闭串口
    close(fd);	     
  
  3.设备文件创建
    1.手动创建,需mknod命令
      创建字符设备文件：
      mknod /dev/设备文件名  c  主设备号  次设备号
      创建块设备文件：
      mknod /dev/设备文件名  b  主设备号  次设备号  
    
    2.自动创建：下回分解
  
  总结：切记,设备文件的使用一定要配合系统调用函数！
  
  5.4.设备文件中的设备号
  1.设备号是个统称,里面包含了主设备号和次设备号
  2.设备号在linux内核中的数据类型：dev_t(unsigned int)
  3.设备号的高12位保存主设备号信息
    设备号的低20位保存次设备号信息
  4.设备号相关的操作宏
    dev_t dev = MKDEV(major, minor)//利用已知的主,次设别号合并一个设别号
    major = MAJOR(dev)//从设备号中提取主设备号
    minor = MINOR(dev) //从设备号中提取次设备号
    嘱咐：掌握MINOR宏的定义编程技巧
  5.主设备号功能：应用程序根据设备文件中的主设备号在内核茫茫的
  		  设备驱动中找到适合自己的设备驱动;
  		  一个设备驱动仅有唯一的对应的主设备号
  6.次设备号功能：如果一个设备驱动管理多个硬件外设,驱动程序
  	          将来根据次设备号来分区用户到底想访问哪个硬件个体
  7.切记：设备号对于内核来说是一种宝贵的资源,所以驱动首先应该
  	  向内核去申请设备号,当然不在使用要记得释放设备号
  8.申请设备号的方法：
    int alloc_chrdev_region(dev_t *dev, 
    			unsigned baseminor,
    			unsigned count,
    			const char *name)
    函数功能：向内核申请设备号信息
    参数：
    dev:保存内核给你分配的设备号信息
    basedminor:希望起始的次设备号,一般从0开始
    count：申请的此设别号的个数
    name:设备名称,注意：不是设备文件名,通过cat /proc/devices查看
    	  
    void unregister_chrdev_region(dev_t dev, 
    				unsigned count)
    释放设备号	          
  		    
   5.5.问：一旦应用程序根据主设备号找到了内核中对应的设备驱动
           怎么样通过设备驱动来访问硬件呢？也就是说设备驱动如何
           给用户提供访问硬件的操作接口呢？
       答：驱动本身就是一类事物,同样内核需要进行对其描述
   1.自行设计字符设备驱动对应的数据结构
     struct char_device {
     	dev_t dev; //保存申请的设备号信息
     	int count; //保存次设备号的个数
     	char *name; //字符设备名称
     };
     
     优化：
     struct file_operations {
     	int (*open)(...) //打开设备接口
     	int (*close)(...) //关闭设备接口
     	int (*read)(...) //读设备接口
     	int (*write)(...) //写设备接口
     	...
     };
     
     struct char_device {
     	dev_t dev; //保存申请的设备号信息
     	int count; //保存次设备号的个数
     	char *name; //字符设备名称
     	struct file_operations *ops; //提供硬件操作接口
     };
     
   2.内核描述字符设备驱动对应的数据结构
   struct file_operations {
     	int (*open)(struct inode *, struct file*) //打开设备接口
     	int (*release)(struct inode *, struct file *) //关闭设备接口
     	ssize_t (*read)(struct file *, char __user *buf, size_t count, loff_t *ppos) //读设备接口
     	ssize (*write)(struct file *, char __user *buf, size_t count, loff_t *ppos) //写设备接口
     	...
   }; //此数据结构用来描述将来给用户提供的访问硬件的操作接口
   注意：此数据结构提供的硬件操作接口非常之多,到底需要哪一个
   必须根据用户的需求来选择！
   
   struct cdev {
   	dev_t dev;//保存申请的设备号
	unsigned int count;//硬件设备的个数
	const struct file_operations *ops;//给用户提供的操作接口
	...
   };//此数据结构用来描述字符设备驱动
  
  3.编写字符设备驱动的步骤：
  1.根据用户需求定义初始化硬件操作接口对象
    struct file_operations led_fops = {
    	.open = led_open, 
    	.release = led_close,
    	.read = led_read,
    	.write = led_write
    };
  2.定义初始化字符设备对象
  struct cdev led_cdev; //定义对象
  cdev_init(&led_cdev, &led_fops);
  //结果：led_cdev.ops = &led_fops //给led_cdev字符设备对象
  添加硬件操作接口led_fops
  
  3.注册安装字符设备对象到内核,一旦注册完毕,内核就存在了一个
  真实的字符设备驱动
  cdev_add(&led_cdev, 申请的设备号, 硬件设备的个数);
  
  4.最后编写各个硬件操作接口函数
    int led_open (...) {...}
    
  5.如果卸载驱动,同样要从内核中卸载字符设备对象
  cdev_del(&led_cdev);
  
  6.应用程序访问驱动提供的硬件操作接口的调用关系：
  应用程序open->C库open->软中断->内核的sys_open->驱动的led_open
  应用程序close->C库close->软中断->内核的sys_close->驱动的led_close
  应用程序read->C库read->软中断->内核的sys_read->驱动的led_read
  应用程序write->C库write->软中断->内核的sys_write->驱动的led_write
  
案例：用户要求打开设备关灯,关闭设备关灯
实施步骤：
1.mkdir /opt/drivers/day02/3.0
2.cd /opt/drivers/day02/3.0/
3.vim led_drv.c
4.vim Makefile
5.make
6.cp led_drv.ko /opt/rootfs
7.vim led_test.c //编写应用测试程序
8.arm-linux-gcc -o led_test led_test.c
  cp led_test /opt/rootfs/
  
ARM执行：
1.insmod led_drv.ko
2.cat /proc/devices //查看申请的主设备号信息
  Character devices://当前系统中的字符设备
  1 mem
  2 pty
  3 ttyp
  ...
  250 tarena
  第一列：申请的主设备号
  第二列：设备名称
  
3.mknod /dev/myled c 250  0 //创建设备文件myled
4../led_test //测试

编写驱动的步骤：
1.头文件
2.入口函数、出口函数
3.写硬件信息,声明的声明,定义初始化的定义初始化
4.定义初始化各种软件相关内容
5.完成入口和出口函数
  先写注释
  再写内容
6.最后将各个硬件操作接口函数定义     
```