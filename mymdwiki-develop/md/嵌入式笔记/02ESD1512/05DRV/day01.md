```
回顾：
1.根文件系统rootfs
  1.1.概念
  1.2.制作rootfs的过程
  	1.下载busybox
  	2.修改配置编译安装
  	  Makefile
  	  make menuconfig
  	  make
  	  make install:_install
  	  		bin sbin usr linuxrc
  	3.创建必要目录和可选目录
  	  dev lib etc proc sys
  	  home var tmp mnt 
  	  
  	4.拷贝动态库
  	  交叉编译器
  	  arm-linux-readelf -a 程序名 | grep "Shared"
  	  软连接
  	  动态链接库(加载器)：ld-*
  	  lib:切记此目录仅仅存放标准的C库或者C++库
  	      自己封装库或者移植的库,一律不允许放到lib下
  	      可以通过环境变量LD_LIBRARY_PATH添加自己的动态库
  	      所在的路径即可！
  	  
  	5.添加系统的启动必要文件
  	  inittab(文本文件)
  	  	sysinit:/etc/init.d/rcS
  	  	respawn:-/bin/sh
  	  rcS(脚本)
  	  	mount -a 	  	
  	  fstab(文本文件)
  	  	proc ...
  	  	sysfs ...
  	  	tmpfs ...  	  	
  	  都由sbin/init第一号进程进行解析执行
  	  启动流程：
  	  上电->uboot(bootcmd)->kernel(bootargs)->rootfs
  	  (init=/linuxrc)->linuxrc->/sbin/init(1号进程)
  	  ->解析inittab(sysinit)->/etc/init.d/rcS脚本->
  	  ->解析fstab(mount -a)->进行一系列的mount工作->
  	  解析inittab(respawn)->/bin/sh->等待用户命令的输入
  	  提示：可以自行分析busybox/init/init.c
  	  
  	6.掌握如何添加一个应用程序的自启动
  	  铭记：只要在系统的启动的脚本中添加即可
  	  
  	7.掌握rootfs向闪存部署的过程
  	  1.制作镜像
  	    mkfs.cramfs
  	    mkyaffs2image
  	  2.让内核支持文件系统格式
  	    make menuconfig
  	    	File System---->
  	    	   ...
  	  3.进行分区规划
  	  4.修改分区表,闪存驱动中
  	  5.烧写,设置启动参数

面试题：谈谈对嵌入式linux软件开发的认识
********************************************************
2.linux设备驱动开发相关内容
  2.1.推荐书籍
      <<Linux设备驱动程序>>第三版
      <<Linux内核设计与实现>>第三版
      <<Unix环境高级编程>>第三版
  2.2.linux系统分两个空间(了解)
      明确：linux系统就是一堆的软件
      用户空间：
      	1.各种命令(ls,cd等)和应用程序,各种库,服务(tftpd-hpa,nfs-kernel-server等)
      	2.用户空间软件在运行的时候,CPU的工作模式为USER模式
      	3.用户空间软件不允许直接访问外设的物理地址,如果要访问
      	  外设的物理地址,必须把外设的物理地址映射到用户的虚拟地址上
      	4.用户空间软件如果进行非法的内存访问,操作系统直接
      	  会将用户软件干掉,不会造成操作系统的崩溃！
      	  例如：*(int *)0 = 0;
      	5.用户空间软件类似"论坛中的普通会员"
      	6.用户空间软件不能去访问内核空间的代码,地址,数据
      	  
      内核空间：
      	1.包含的软件就是zImage(七大子系统的软件内容)
      	2.内核空间软件在运行的时候,CPU的工作模式为SVC模式
      	3.内核空间软件同样不能直接访问外设的物理地址,同样需要
      	  将外设的物理地址映射到内核的虚拟地址上  
      	4.内科空间软件如果进行非法的内存访问,操作系统直接
      	  崩溃(吐核,类似windows蓝屏),例如：*(int *)0 = 0; 
        5.内核空间软件类似"论坛中的管理员"
        6.用户空间软件和内核空间软件进行通信交互的唯一途径
          只能是系统调用(open,close,read,write等)
          本质：系统调用是用户空间切换到内核空间,本质就是
                CPU工作模式的切换(USER->SVC),得到结论
                系统调用实现的根本依据软中断！
          例如：LED驱动测试
          用户空间软件led_test.c调用open/close访问内核空间软件led_drv.c
    
    2.3.问：内核空间软件如何编写呢？
        答：明确：内核空间软件只能用汇编和C
        1.内核软件编程框架：
        回顾用户空间软件编程框架：
        #include <stdio.h> //标准C头文件
        
        //main为程序的入口函数
        int main(int argc, char *argv[])
        {
        	//标准C库
        	printf("hello,tarena\n");
        	//业务
        	return 0;//为程序的出口
        }          
        
        内核软件编程框架：
        参考代码：
        mkdir /opt/drivers/day01/1.0 -p
        cd /opt/drivers/day01/1.0 
        vim helloworld.c 添加如下内容
        #include <linux/init.h>
	#include <linux/module.h>
	static int helloworld_init(void)
	{
		printk("hello, kernel!\n");
		return 0;
	}        
	static void helloworld_exit(void)
	{
		printk("good bye kernel!\n");
	}	
  	module_init(helloworld_init);
  	module_exit(helloworld_exit);
  	MODULE_LICENSE("GPL"); 
  	
  	总结：
  	1.内核程序的头文件不再是标准C的头文件
  	  内核头文件位于内核源码中(/opt/kernel)
  	2.内核程序的入口函数必须使用module_init进行修饰
  	  内核才能认为此函数为入口函数,并且入口函数的要求
  	  返回值为int,参数为void,执行成功返回0,失败返回负值
  	  类似应用程序的main函数
  	3.内核程序的出口函数必须使用module_exit进行修饰 
  	  内核才能认为此函数为出口函数,返回值和参数都是void
  	  类似应用程序的return 0;
  	4.内核程序只要是个.c文件,必须添加：
  	  MODULE_LICENSE("GPL"); 告诉内核俺也遵循GPL协议
  	  咱是一家人！
  	5.printk不是标准C库的函数,而是内核自己实现的打印函数
  	  内核嫌弃C库的函数又大又笨！
  	  内核软件设计宗旨：运行速度要快！      
  	
  	问：内核程序如何编译？
  	答：在一起/单独编译(回忆)
    
    2.4.内核程序采用模块化编译方式(单独编译成.ko文件)
    明确：编译内核程序一定要关联使用内核源码	
    只需一个小小的Makefile文件即可编译内核程序
    cd /opt/drivers/day01/1.0
    vim Makefile 添加如下内容：
    obj-m += helloworld.o #将helloworld.c单独编译成helloworld.ko
    all:
    	make -C /opt/kernel SUBDIRS=$(PWD) modules
    clean:
    	make -C /opt/kernel SUBDIRS=$(PWD) clean
    保存退出
    说明：
    make -C /opt/kernel:等价于cd /opt/kernel;make	
    PWD:此环境变量保存当前路径
    SUBDIRS:保存当前路径
    modules:采用模块化方式编译
    结果：到/opt/kernel目录下执行make modules,进行模块化编译
    但是内核程序在/opt/drivers/day01/1.0下,所以通过SUBIDRS
    告诉内核(嗨,内核程序不再内核源码中,在/opt/drivers/day01/1.0)
    请内核到这个模块下把源码进行模块化编译(编译成.ko) 
    
    2.5.编译内核程序
    cd /opt/drivers/day01/1.0
    make
    ls 
      helloworld.ko
    将内核程序的二进制文件ko拷贝到根文件系统
    cp hellworld.ko /opt/rootfs  
    
    2.6.开发板测试第一个内核程序
    重启开发板,挂接NFS网络文件系统,linux启动以后执行：
    1.insmod helloworld.ko //安装内核程序到内核zImage
      //观察是否有打印信息
    2.lsmod  //查看内核已经安装的内核程序的信息
    3.rmmod helloworld //从内核中卸载安装的内核程序 
      //观察是否有打印信息  
    
    总结：
    1.insmod时,内核会调用内核程序的入口函数
    2.rmmod时,内核会调用内核程序的出口函数
      
3.linux内核程序之命令行传参
  1.回顾应用程序命令行传参
  #include <stdio.h>
  int main(int argc, char *argv[])
  {
  	int a;
  	int b;
  	if (argc != 3) {
  		printf("Usage: %s <num1> <num2>\n",argv[0]);
  		return -1;
  	}
  	//"0x12345" -> 0x12345
  	a = strtoul(argv[1], NULL, 0);
  	b = strtoul(argv[2], NULL, 0)  	
  	printf("a = %d, b = %d\n", a, b);
  	return 0;
  } 
  gcc helloworld.c
  ./a.out 100 200
  argc=3
  argv[0] = "./a.out"
  argv[1] = "100"
  argv[2] = "200"
  
  2.内核程序的命令行传参
  切记：内核程序的命令传参,接收参数的内核变量不是局部变量
        只能是全局变量,数据类型不能为结构体
  切记：内核接收参数的全局变量必须要进行传参声明
  声明的宏：module_param
  module_param(name, type, perm);
  功能：给内核接收参数的全局变量进行传参声明
  name:变量的名
  type:变量的数据类型
       bool,invbool
       char,uchar
       short,ushort
       int,uint
       long,ulong
       charp(char *)
       
       不能为结构体,更不能是float和double
       浮点数不要出现在内核源码中,浮点数的处理放在应用软件完成
       
  perm:变量的访问权限,一般用8进制数表示,0664
       不允许有可执行权限！ 
  
  linux系统调试宏：
  __FILE__
  __FUNCITON__/__func__
  __LINE__
  __DATE__
  __TIME__
  
  案例：编写内核程序,掌握内核命令行传参
  实施步骤：
  PC机执行：
  1.mkdir /opt/drivers/day01/2.0 
  2.cd /opt/drivers/day01/2.0
  3.vim helloworld.c
  4.vim Makefile
  5.make
  6.cp helloworld.ko /opt/rootfs/
  
  ARM开发板执行：
  //不传参
  1.insmod hellworld.ko 
  2.rmmod helloworld
  
  //安装加载内核程序时传参
  1.insmod helloworld.ko  irq=100 pstring=china
  2.rmmod helloworld
  
  //安装加载内核程序以后传参
  1.insmod helloworld.ko  irq=100 pstring=china
  2.cat /sys/module/helloworld/parameters/irq  //读取irq文件的内容
                   加载内核程序以后自动生成
  3.echo 20000 > /sys/module/helloworld/parameters/irq //把irq文件内容重新写入一个新值20000
  4.rmmod helloworld //验证irq变量的值
  
  总结：
  1.如果传参声明时,权限非0,那么在/sys/module/模块名/....生成
    一个跟变量同名的文件,此文件的内容就是变量的值
  2.将来修改文件的内容间接修改变量的值
  3.权限为0,就不会存在同名的文件,此变量的传参只能在加载时传参
  4.如果没有加载以后传参的需求,建议权限给0,目的为了节省内存资源
    /sys目录下所有的内容都存在内存中！
    
***********************************************************
4.linux内核符号导出
  符号=symbol:变量名,函数名
  导出=给别人调用,访问
  1.回顾：应用程序多文件之间的函数调用
  mkdir /opt/drivers/day01/3.0
  cd /opt/drivers/day01/3.0
  vim test.h
  #ifndef __TEST_H
  #define __TEST_H
  
  extern void mytest(void);//声明
   
  #endif
 
  vim test.c
  
  #include <stdio.h>
  //定义
  void mytest(void) 
  {
  	printf("%s\n", __func__);
  }
  
  vim main.c
  #include <stdio.h>
  #include "test.h" //声明
  int main(void)
  {
  	mytest(); //调用
  	return 0;
  }
  
  编译：
  mkdir /opt/rootfs/home/lib
  arm-linux-gcc -shared -fpic -o libtest.so test.c
  arm-linux-gcc -o main main.c -L. -ltest
  cp main /opt/rootfs/
  cp libtest.so /opt/rootfs/home/lib
  
  开发板测试：
  ./main //提示libtest.so找不到
  export LD_LIBRARY_PATH=/home/lib:$LD_LIBRARY_PATH
  ./main //OK
  
  
  2.内核多文件函数变量的访问调用
  切记：内核程序要实现这种功能,需要对变量或者函数进行显示的
        导出,让内核知道这个变量或者函数能够让别的文件去访问
  导出变量和函数的方法：
  EXPORT_SYMBOL(函数名或者变量名);
  或者
  EXPORT_SYMBOL_GPL(函数名或者变量名);
  注意：
  1.以上两个宏都是用于导出函数或者变量给别人访问
  2.前者导出的函数或者变量,不管这个内核程序是否遵循GPL协议
    都可以访问这个变量或者函数;
    后者导出的函数或者变量,只能给那些遵循GPL协议的内核程序
    访问调用！
  总结：任何.c都需要添加：MODULE_LICENSE("GPL");
  
  案例：编写内核程序,掌握符号导出
  PC机执行：
  1.mkdir /opt/drivers/day01/4.0 -p
  2.cd /opt/drivers/day01/4.0
  3.vim test.h //声明
  4.vim test.c //定义
  5.vim helloworld.c //调用
  6.vim Makefile //两个.c需要编译
    obj-m += helloworld.o
    obj-m += test.o
    ...
  7.make
  8.cp *.ko /opt/rootfs/
  
  ARM执行：
  1.insmod test.ko
  2.insmod helloworld.ko 
    注意：helloworld.ko 依赖 test.ko
    
  3.rmmod helloworld
  3.rmmod test

***********************************************************
5.linux内核打印函数printk
  1.printk VS printf
    相同点：都是用于打印信息
  	    用法一致
    不同点：前者只能用于内核空间
            后者只能用于用户空间
  
  2.printk能够指定打印输出级别(8级)
    #define	KERN_EMERG	"<0>"	/* system is unusable			*/
    #define	KERN_ALERT	"<1>"	/* action must be taken immediately	*/
    #define	KERN_CRIT	"<2>"	/* critical conditions			*/
    #define	KERN_ERR	"<3>"	/* error conditions			*/
    #define	KERN_WARNING	"<4>"	/* warning conditions			*/
    #define	KERN_NOTICE	"<5>"	/* normal but significant condition	*/
    #define	KERN_INFO	"<6>"	/* informational			*/
    #define	KERN_DEBUG	"<7>"	/* debug-level messages			*/
    结论：数字越小,代表的危险程度越高,打印输出优先级越高
    用法：
    printk(KERN_ERR "this is a error msg!\n");
    或者
    printk(“<3>” "this is a error msg!\n");

  3.明确：只要有打印输出信息,肯定势必占用CPU资源,所以
          在某些场合,有些信息是没有必要进行打印输出,
          但有些信息需要打印输出,为了节省CPU资源;
          这里咱们只需设置一个默认的打印输出阀值即可,
          只要将来printk指定的打印输出级别小于默认的打印输出
          阀值,此信息不打印,否则打印输出
          
    问：默认的打印输出阀值如何设置呢？(水位的警戒线)
    答：两种方法
    方法1：通过修改配置文件/proc/sys/kernel/printk
    案例：编写一个内核程序,掌握方法1
    1.vim printk_all.c
    2.vim Makefile
    3.make
    4.cp printk_all.ko /opt/rootfs/
    
    ARM开发板执行：
    1.insmod printk_all.ko //查看打印信息
    2.rmmod printk_all
    3.cat /proc/sys/kernel/printk
      7(UART终端默认打印输出级别)       4       1       7
    4.echo 8 > /proc/sys/kernel/printk
      将默认的打印输出级别设置为8
    5.insmod printk_all.ko
    6.rmmod printk_all
    
    总结：
    /proc目录下的任何内容都是存在于内存中,如果系统重启
    之前的配置就无效！
    方法1有个致命的缺点之前的配置会随着系统的重启而丢失
    更更关键的是这种方法无法去左右内核启动时的打印信息！
    
    方法2:能够解决方法1的致命缺点
          只需设置内核的启动参数即可
    实施步骤：
    1.重启开发板进入uboot的命令行模式,执行：
    setenv bootargs root=/dev/nfs nfsroot=192.168.1.8:/opt/rootfs ip=192.168.1.110:192.168.1.8:192.168.1.1:255.255.255.0::eth0:on init=/linuxrc console=ttySAC0,115200 debug
    boot
    启动以后：
    insmod printk_all.ko
    rmmod printk_all
    cat /proc/sys/kernel/printk
    debug：指定的默认打印输出级别为10
    
    2.重启开发板进入uboot的命令行模式,执行：
    setenv bootargs root=/dev/nfs nfsroot=192.168.1.8:/opt/rootfs ip=192.168.1.110:192.168.1.8:192.168.1.1:255.255.255.0::eth0:on init=/linuxrc console=ttySAC0,115200 quiet
    boot
    启动以后：
    insmod printk_all.ko
    rmmod printk_all
    cat /proc/sys/kernel/printk
    quiet：指定的默认打印输出级别为4
    
    3.重启开发板进入uboot的命令行模式,执行：
    setenv bootargs root=/dev/nfs nfsroot=192.168.1.8:/opt/rootfs ip=192.168.1.110:192.168.1.8:192.168.1.1:255.255.255.0::eth0:on init=/linuxrc console=ttySAC0,115200 loglevel=0
    boot
    启动以后：
    insmod printk_all.ko
    rmmod printk_all
    cat /proc/sys/kernel/printk
    
    总结：
    1.产品研发阶段使用debug
    2.产品发布阶段使用quiet或者loglevel=0,
      目的加快内核的启动速度,保护软件的秘密
    
    
     
    












  
  
    
  
  








               
                   
   
```