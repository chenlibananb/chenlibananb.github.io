```
回顾：
1.掌握嵌入式linux系统的部署过程
  场景：给一块开发板,如何将linux系统部署起来
  bootcmd
  bootargs
  NFS网络服务

2.嵌入式linux系统软件组成部分
  bootloader
  zImage
  rootfs

3.嵌入式linux系统软件之uboot
  面试题：谈谈对uboot的理解
  1.bootloader = boot(硬件初始化) + loader(加载引导)
    统称,uboot居多
  2.uboot特点
    开源
    支持多种架构
    支持多种硬件开发板
    支持引导多种操作系统
  3.uboot的功能
    两大功能：
    硬件初始化(boot):明确并不是所有的硬件都需要在uboot中进行
                     初始化
                     问：为什么？
                     答：有些产品,有些硬件如果都在uboot中
                     进行初始化,代表uboot所做的工作就多
                     代表着启动时间拉长,代表着系统启动时间
                     过程,代表着用户体验就差,比如无线路由器就没有
                     必要对LCD进行初始化,但是手机就需要进行
                     LCD的初始化,因为要显示LOGO
                     
                     结论：
                     必要的硬件：
                     	初始化CPU
                     	初始化内存
                     	初始化闪存
                     	判断启动方式
                     	初始化系统时钟
                     	初始化UART
                     	关闭看门狗
                     	禁止中断   
                     	等                 	
                     可选的硬件：
                     	依赖用户的实际对产品的需求
                     	举例子：LOGO显示和组合按键
     加载(上位机/Nand)启动内核,关键还要给内核传递启动参数：
     bootcmd：加载启动
     bootargs:传递启动参数
     
   4.问：u-boot.bin二进制可执行文件从何而来
     答：切记+明确：ARM裸板的shell程序就是一个最简单的uboot
         u-boot本质就是一个裸板程序
         回顾：shell基本框架
     4.1.明确一定要在linux上位机部署交叉编译器
         切记：建议从芯片厂家或者开发板厂家获取
               建议ARM交叉编译器的官方网站下载
               注意：交叉编译器的版本要合适
     
     4.2.获取uboot源码
         切记：uboot源码一般都是由芯片厂家提供
               但是此源码仅仅支持芯片厂家的参考板
               注意：此源码有可能在你当前的开发板上无法
               正常的运行(因为CPU一致,有可能外设不一样,内存,闪存等)
               此时此刻需要对官方的uboot源码进行修改(修改的过程又称移植)
         切记：如何理解uboot移植？
               1.获取uboot源码
               2.获取芯片公司的参考板的硬件信息
                 一般来说硬件工程师明白！
               3.拿你的开发板和芯片公司的参考板进行
                 硬件信息的对比,找出不一样的地方,一定要让
                 硬件工程师进行协助！
                 举例子：
                 参考板的硬件信息：
                 	CPU:S5PV210
                 	内存容量：1GB
                 	Nand容量: 2GB
                 	调试UART: UART2
                 	...
                 自己开发板的硬件信息：
                        CPU:S5PV210
                        内存容量：512MB
                 	Nand容量: 513MB
                 	调试UART: UART0 
                 	...
                 4.根据硬件的差异,有针对性的对uboot源码进行
                   修改
                   
     4.3.对uboot源码进行操作(配置,编译)
         以：TPAD,CW210开发板的uboot源码为例 
     	 1.获取源码u-boot_CW210_1.3.4.tar.gz
     	 2.在windows解压缩一份
     	   在纯linux系统也解压缩一份
     	 3.利用sourceinsight创建uboot源码工程
     	   3.1.在windows安装sourceinsight源码阅读工具
     	   3.2.纯linux系统可以使用ctags阅读源码
     	       当然也可以安装wine(模拟器)来安装sourceinsight
          
           sourceinsight创建源码工程步骤：
           Project->New Project->指定工程名：uboot
                                 指定工程的路径：uboot源码根目录
           ->ok->ok->去掉勾"Show only ..."->Add All->
           在弹出的对话框中将第二个选项加勾->OK->大概添加1391个文件
           ->close 至此源码工程创建完毕
           
           Project->Sync... File(同步源码)-> 
              选中,点击右键,jump to ...
              左右箭头表示前进后退
              R:搜索
             
          纯linux系统ctags创建源码工程步骤：
          1.将uboot源码在linux下解压缩
            cp  u-boot_CW210_1.3.4.tar.gz /opt/
            cd /opt/
            tar -xvf u-boot_CW210_1.3.4.tar.gz
            mv u-boot_CW210_1.3.4 uboot  
            cd uboot
            ctags -R * //创建源码工程
                生成了一个tags文件(数据库文件)
            //阅读远吗
            vim lib_arm/board.c +584
            光标移动到查看的变量或者函数上
            操作快捷键：
            ctrl+]:跳转到定义的地方
            ctrl+o:返回
          
          4.切记：拿到源码先不做任何改动,仅仅是配置编译
                  目的是验证源码的完整性或者验证编译器和
                  uboot版本是否搭配
            cd /opt/uboot
            make distclean //获取最干净的源码
                             只做一次即可
            make ABC_config //将uboot源码配置成能够运行在
                              ABC这块开发板上
                              切记：ABC就是开发板的名称
                              例如：
                              三星的S5PV210参考板：SMDKV210/smdkv210
                              达内的S5PV210开发板：CW210/cw210
                              某位同学自己开发板：TQ210/tq210
                              注意：如果是本公司自己的硬件工程师
                              基于参考板设计的硬件电路板,此时ABC只要
                              符合参考板的名字即可！                       
           对于达内的TPAD开发板,执行：
           cd /opt/uboot
           make distclean
           make CW210_config  
                arm s5pv210 CW210...
                arm:将来这个代码运行在ARM架构
                s5pv210:将来这个代码运行在S5PV210处理器
                CW210:将来这个代码运行在CW210开发板上
                
           time make -j2  //编译源码,结果是uboot源码根目录生成二进制可执行文件
           ls             //-j2:双核同时编译
                          //-j4:四核同时编译
           	u-boot.bin       
           结论：如果编译成功,验证了代码的完整性
           
         5.切记：一定要看编译uboot的打印信息(只看最后的链接时的打印信息)
         cd /opt/uboot && arm-linux-ld -Bstatic -T /opt/uboot/board/CONCENWIT/CW210/u-boot.lds  -Ttext 0x23e00000 $UNDEF_SYM cpu/s5pv210/start.o \
			--start-group lib_generic/libgeneric.a cpu/s5pv210/libs5pv210.a cpu/s5pv210/s5pv210/libs5pv210.a lib_arm/libarm.a fs/cramfs/libcramfs.a fs/fat/libfat.a fs/fdos/libfdos.a fs/jffs2/libjffs2.a fs/reiserfs/libreiserfs.a fs/ext2/libext2fs.a net/libnet.a disk/libdisk.a drivers/bios_emulator/libatibiosemu.a drivers/block/libblock.a drivers/dma/libdma.a drivers/hwmon/libhwmon.a drivers/i2c/libi2c.a drivers/input/libinput.a drivers/misc/libmisc.a drivers/mmc/libmmc.a drivers/mtd/libmtd.a drivers/mtd/nand/libnand.a drivers/mtd/nand_legacy/libnand_legacy.a drivers/mtd/onenand/libonenand.a drivers/mtd/ubi/libubi.a drivers/mtd/spi/libspi_flash.a drivers/net/libnet.a drivers/net/sk98lin/libsk98lin.a drivers/pci/libpci.a drivers/pcmcia/libpcmcia.a drivers/spi/libspi.a drivers/rtc/librtc.a drivers/serial/libserial.a drivers/usb/libusb.a drivers/video/libvideo.a common/libcommon.a libfdt/libfdt.a api/libapi.a post/libpost.a board/CONCENWIT/CW210/libCW210.a --end-group -L /home/tarena/workdir/toolchains/opt/S5PV210-crosstools/4.4.6/bin/../lib/gcc/arm-concenwit-linux-gnueabi/4.4.6 -lgcc \
			-Map u-boot.map -o u-boot
	
	 总结：
	 1.uboot的链接采用静态方式
	 2.uboot的链接脚本:u-boot.lds	
	 3.uboot的链接时的起始地址:0xc23e0000虚拟地址->物理地址0x23e00000
	   代表着将来uboot运行的内存起始地址就是0x23e00000
	 4.uboot原材料分别是：
	   cpu/s5pv210/start.o
	   lib_generic/libgeneric.a
	   cpu/s5pv210/libs5pv210.a
	   cpu/s5pv210/s5pv210/libs5pv210.a
	   lib_arm/libarm.a
	   ...
	   结论：将来只要关注cpu目录和board目录
	   	
	 arm-linux-objcopy --gap-fill=0xff -O srec u-boot u-boot.srec
	 arm-linux-objcopy --gap-fill=0xff -O binary u-boot u-boot.bin
	 arm-linux-objdump -d u-boot > u-boot.dis
  
         6.问：如何看uboot源码呢？
           答：看裸板程序代码,只要找到运行的第一个文件
               和第一个入口函数,顺藤摸瓜
               通过阅读链接脚本来获取运行的文件和函数
           cd /opt/uboot
           vim board\CONCENWIT\CW210/u-boot.lds
           ENTRY(_start):程序的入口函数_start
           cpu/s5pv210/start.o	(.text):uboot运行的第一个文件cpu/s5pv210/start.S
           
           6.1.利用vim或者sourceinsight慢慢品味start.S
           1.注意：仅作了解：
             关于cp15协处理器相关操作的汇编实现过程
             参见文档：DDI0344K_cortex_a8_r3p2_trm.pdf
             	mrc     p15, 0, r0, c1, c0, 1
             	                        CRm opcode_2
		说明：利用mrc指令能够将CP15协处理器中的
		寄存器c1拷贝ARM核寄存器r0中
		关于c1寄存器在P125
		
		bic     r0, r0, #(1<<1)
		说明：将r0的bit[1]清0
		
		mcr     p15, 0, r0, c1, c0, 1          
                说明：利用mcr指令将ARM寄存器r0的数据拷贝到
                CP15协处理器的c1寄存器中     
             2.友情提示：
               start.S不用修改
             
             案例：修改start.S,添加LED的开灯操作
             实施步骤：
             cd /opt/uboot
             vim cpu/s5pv210/start.S +447 从start.S跳转到C语言代码之前点灯
             在ldr pc, _start_armboot之前将两个灯点亮
             切记：假设将来怀疑start.S有问题,又没有初始化
                   串口,点灯测试调试汇编代码start.S是非常
                   有效的方法！
             保存退出
             make //make之前一定要确保之前执行过：
                    make CW210_config      
             生成新的u-boot.bin
             cp u-boot.bin /tftpboot
             
             开发板执行：
             1.重启开发板,进入uboot命令行
               tftp 20008000 u-boot.bin
               nand erase 0 200000
               nand write 20008000 0 200000
               reset //复位
               新的uboot重新执行,查看灯是否有变化      
                   
             总结：start.S所做内容：
             1.切换到SVC模式,禁止中断
             2.初始化Cache
             3.初始化系统时钟
             4.关闭看门狗
             5.初始化串口
             6.初始化Nand
             7.将uboot搬移到DRAM中
             8.设置栈指针
             9.跳转到C语言的处理阶段:start_armboot
             
           6.2.进入C语言的处理阶段start_armboot(类似shell的main函数)
           vim lib_arm/board.c  +327
           start_armboot()
           {
           	//各种硬件初始化工作
           	for (init_fnc_ptr = init_sequence; 
			*init_fnc_ptr; ++init_fnc_ptr) {
		if ((*init_fnc_ptr)() != 0) {
			hang ();
			}
	   	}
	   	xxx_init();
	   	
           	//进入死循环
           	for (;;) {
			main_loop () {
			  //也可以做硬件初始化工作
			  xxx_init();
			  
			  //接收用户的命令
			  //执行对应的命令
			   for(;;) {
			   	//获取终端输入的命令
			   	readline (CFG_PROMPT);
			   	strcpy (lastcommand, console_buffer);
			   
			   	//执行命令
			   	run_command (lastcommand, flag);
			   }
			}
				
		}
           }
           作业：
           掌握	
           for (init_fnc_ptr = init_sequence; 
			*init_fnc_ptr; ++init_fnc_ptr) {
		if ((*init_fnc_ptr)() != 0) {
			hang ();
		}
	   }
	   学习编程思想,改造shell的main函数
	   
           案例：在C语言的处理阶段开关灯
           vim common/main.c +412添加
           led_init(); //led初始化
           led_on(); //开灯
           
           在main.c的前面添加
           led_init
           led_on两个函数的定义
           
           保存退出
           make
           cp u-boot.bin /tftpboot
           开发板继续更新自己
           
        7.切记：实际在移植uboot时,关键看一个头文件
                相当之重要,此头文件定义了大量的跟开发板
                硬件相关的信息,如果将来硬件信息有区别
                一般只需修改此文件即可！
          cd /opt/uboot
          vim include/configs/CW210.h
          注意：任何一个硬件开发板都有一个对应的头文件
                此头文件命令：开发板名.h
          例如：
          三星参考板配置信息：
          CPU:三星S5PV210
          内存基地址：0x200000000 
          LCD分辨率：800X600
          晶振：24MHz
          DM9000：接到BANK1,地址=0x88000000
          调试UART:UART2(第三个)
          LM77设备：0x48
          ...
          
          张三同学开发板硬件配置信息：
          CPU:三星S5PV210
          内存基地址：0x300000000      
          LCD分辨率：800X480
          晶振：12MHz
          DM9000：接到BANK2,地址=0x90000000         
          调试UART:UART0(第一个) 
          LM77设备地址:0x50
          ...
          
          切记：此头文件相当重要！！！！！！！
          
          案例：修改uboot提示符
          cd /opt/uboot
          vim include/configs/CW210.h +297
          将tarena改为自己喜欢的字符串youcw
          保存退出
          make
          cp u-boot.bin /tftpboot
          
          重启开发板,进入uboot命令行执行
          tftp 20008000 u-boot.bin
          nand erase 0 200000
          nand write 20008000 0 200000
          reset //看提示符是否改变
      
          总结：uboot源码关键记住两个即可：
          start.S:将来根据这个能够理清楚源码的执行过程
          CW210.h:将来这个要用于源码的移植工作
          
              
      
```    