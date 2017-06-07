```
回顾：
1.uboot相关内容
  面试题：谈谈对uboot的理解
  把logo功能说进去！
  
2.uboot命令的实现过程
  //uboot命令定义
  vim /opt/uboot/common/cmd_xxx.c  
  U_BOOT_CMD(
  	命令的名字,
  	命令参数的个数,
  	命令是否重复,
  	命令对应的执行函数,
  	命令的简要说明,
  	命令的详细说明  //help xxx
  );
  
  编写命令对应的执行函数
  do_xxx(...,...,argc, argv[])
  {
  	//根据实际的业务需求完成命令函数即可
  	return 0;
  }
  
  修改Makefile添加对cmc_xxx.c的编译支持

3.uboot的logo功能
  uboot是否必须添加logo功能,举例子手机和路由器
  logo显示的原则
  LCD显示的基本原理
  图像颜色在内存的表示
  显存的软件编程操作

4.5.1假期作业：uboot添加组合按键功能
  
*********************************************************
2.明确：嵌入式linux系统软件组成部分：
  bootloader:uboot
  linux内核：zImage
  根文件系统:rootfs
  问：部署系统时内核zImage镜像从何而来？
  答：具体操作步骤如下：
  2.1.linux内核特点
  1.优酷观看<<the code linux>>
  2.著名开源软件,操作系统内核,91年正式上线
    www.kernel.org
  3.支持多种处理器架构
    X86
    ARM
    POWERPC
    MIPS
    FPGA+ARM
    DSP+ARM
    等
  4.支持多用多样非常丰富硬件开发板
  5.linux内核版本定义
    2时代：
    linux-2.4 //稳定版本
    linux-2.5 //内部测试版本
    linux-2.6 //稳定版本
    ...
    3时代：
    linux-3.0
    linux-3.1
    linux-3.2
    ...
    4时代：
    linux-4.5.2      
    
    三星官方参考板smdkv210使用的内核版本:2.6.35.7
    TPAD使用的官方内核版本：2.6.35.7
    
  2.2.linux内核功能
  1.明确：linux内核相当于大管家,服务器
    明确：应用程序(UC)相当于客户端
    
  2.linux内核7大子系统(7大主要功能)
    1.进程管理子系统
      进程创建(fork),进程退出(exit)
      进程的切换,抢占调度(调度器)
    
    2.内存管理子系统
      内存分配(malloc),内存销毁(free)
      虚拟地址到物理地址的映射(mmap)
    
    3.系统调用
      切记：系统调用是应用程序和内核交互的唯一桥梁
            应用程序调用系统调用函数其实就是想内核发起
            服务请求而已！
      open/close
      read/write
      fork/exit
      mmap/sbrk/...
      
    4.网络协议栈
      TCP/IP协议栈的软件实现代码
      内核支持多种多样的网络协议和服务
      例如：NFS网络服务
      
    5.设备驱动
      内核支持多样多样的硬件设备驱动程序
      衡量一个操作系统是否流行,关键看此操作系统
      支持的硬件种类是否丰富！
      
    6.文件系统
      内核支持多种多样的文件系统类型
      NTFS,FAT32,NFS网络文件系统,cramfs,yaffs2,ext3,ext4等
    
    7.平台代码(BSP)
      为什么linux内核能够运行在X86,POWERPC,MIPS,ARM等等
      处理器上,说明一点内核的软件支持这些处理器
      这些软件又称平台代码(硬件初始化代码)  
    
    3.回归：问：内核二进制镜像zImage从何而来？
      二进制来在于源码
      源码需要交叉编译
      
      3.1.切记：务必先部署交叉编译器
          注意：
          1.交叉编译器一般从芯片厂家获取
          2.交叉编译器的版本要合适
      
      3.2.获取linux内核源码
      	  切记：获取开发板上的内核源码千万不要到www.kernel.org
      	        去下载,因为此网站的源码更新慢！
      	  切记：内核源码一定要从芯片厂家获取
      	  切记：芯片厂家的内核源码仅仅支持芯片厂家的参考板
      	  切记：自己的开发板前期设计时也是基于芯片厂家的参考板进行裁剪设计
      	  切记：最后只需找到自己的开发板和参考板之间的硬件差异
      	        将来对芯片厂家的参考内核代码进行针对性的修改(移植)即可
      	  参考案例：某个项目使用飞思卡尔ARM处理器IMX25
      	  参考板基本硬件配置：
      	  CPU:IMX25
      	  调试UART:UART0,UART1,UART2,UART3
      	  晶振：12MHz
      	  内存：512MB
      	  NorFlash：256MB
      	  NandFlash：1GB
      	  DM9000网卡：16bit模式,基地址：0x10000000
      	  ...
      	  
      	  FPU(自己板子)板卡：
      	  CPU:IMX25
      	  调试UART:UART2
      	  晶振：24MHz
      	  内存：1GMB
      	  NorFlash：1GMB
      	  DM9000网卡：16bit模式,基地址：0x20000000
      	  ...
      	  结论：将来根据硬件信息改代码
      	  
      	  TPAD开发板的厂家提供的源码：ftp://PORTING/kernel.tar.bz2(三星公司)
      	        
       3.3.源码操作1(创建源码的阅读工程)
           1.winddows下解压,利用sourceinsight创建源码工程
           2.linux系统操作：
             cp kernel.tar.bz2 /opt/
             cd /opt
             tar -jxvf kernel.tar.bz2 //生成kernel目录
             cd kernel
             ctags -R * //创建源码阅读工程
             
             或者
             linux安装wine来运行sourceinsight
     
      3.4.源码操作2(验证官方源码的完整性,先不做任何改动)
          1.解压缩：
          cp kernel.tar.bz2 /opt/
          cd /opt
          tar -jxvf kernel.tar.bz2 //生成kernel目录
          cd kernel //进入内核源码根目录
          
          2.大概扫一眼内核源码结构
            ls
            
            arch目录：存放平台代码(各种硬件初始化)
            block目录:硬盘相关驱动
            Documentation目录：内核说明文档
            drivers：存放各种设备驱动程序
            fs目录:存放各种文件系统
            include目录：各种头文件
            init目录：内核启动代码(无需关注)
            ipc目录：进程间通信的代码
            kernel目录：内核启动代码(无需关注)
            lib目录：内核自己封装的库函数(string.c)
            mm目录：内存管理代码
            net目录：TCP/IP网络协议栈代码
            sound目录：声卡驱动
            
            总结：嵌入式linux开发关键目录：arch/drivers/sound
          
         3.make distclean //获取最干净的源码
                            只做一次
         
         4.make ABC_defconfig //对内核源码进行配置,能够让内核源码
                             运行在某个架构和某个硬件开发板上
                             注意：
                             ABC:就是开发板的名称
                             例如：
                             三星参考板：smdkv210_config
                             TPAD:cw210_config
                             TQ210:tq210_config
                             无名开发板,一定要使用参考板！
          结论：对于TPAD执行：
          make cw210_defconfig (官方方法) //也只做一次!
          配置的结果本质就是将arch/arm/configs/cw210_defconfig
          拷贝到源码根目录的.config
          或者：
          cp arch/arm/configs/cw210_defconfig .config //类似make cw210_config
          结论：ABC_config配置名和arch/arm/configs有一个文件是
          同名,利用cp拷贝即可,目标文件必须.config                                   
             
         5.time make zImage -j2 //编译内核源码
          生成的zImage在arch/arm/boot目录下
          
         6.查看成果
         ls arch/arm/boot/ -lh
           zImage    
       
           注意：此时此刻,可以将zImage在开发板尝试运行
      
      3.5.前提：如果内核无法运行,怎么办？
          1.首先看内核的配置选项
            掌握内核关键的配置选项：
            cd /opt/kernel
            make menuconfig //启动内核的配置菜单
            	配置失败友情提示：自己安装linux系统的同学注意：
            	sudo apt-get install libncurses5-dev
            1.System Type  ---> 
                //当前内核支持ARM架构
                //当前内核支持三星的S5PV210和S5PC110
            	ARM system type (Samsung S5PV210/S5PC110)  --->  
            	
                //指定调试串口,一定要结合自己的开发板
            	(0) S3C UART to use for low-level messages  
          	
          	//当前内核支持开发板SMDKV210
          	Board selection (SMDKV210)  --->
          
           2.Boot options  ---> 
              //用来指定内核默认的启动参数
              //明确：内核启动参数就是将来用于内核去挂接根文件系统
              //明确：内核传递参数参数有两种方法：
              	      1.通过uboot的bootargs
              	      2.内核自身传递参数(靠自己) 
              		圆括号里的内容就是内核自身传递的参数信息
              		选中以后,可以进行修改
              	      问：内核到底采用哪个启动参数呢？
              (root=/dev/nfs) Default kernel command string   	  
              答：
              //如果按Y选中这个配置,表明将来内核使用自己的参数
              //如果不选中这个配置,表明内核将来使用uboot的bootargs
              [ ]Always use the default kernel command string  
           
           3. Device Drivers  ---> //设备驱动的支持 
              //支持Nor和Nand驱动  
              <*> Memory Technology Device (MTD) support  --->
         
              //网卡驱动
              [*] Network device support  ---> 
              
              //键盘,鼠标,触摸屏,游戏手柄和遥感
              //各类传感器
              Input device support  --->
              
              //I2C总线驱动支持
              <*> I2C support  ---> 
             
             //SPI总线驱动支持 
             [*] SPI support  --->
             
             //1-wire(一线式总线)驱动支持
             < > Dallas's 1-wire support  --->   
  
  	     //看门狗驱动支持
  	     [*] Watchdog Timer Support  ---> 
  	     
  	     //摄像头驱动支持
  	     <*> Multimedia support  ---> 
  	     
  	     //LCD显示屏驱动
  	     Graphics support  ---> 
  	     
  	     //USB设备驱动
  	     [*] USB support  --->  
  	     
  	     //SD,TF卡驱动
  	     <*> MMC/SD/SDIO card support  --->
  	  
  	  4. File systems  ---> //文件系统支持
  	     [*] Miscellaneous filesystems  --->  
  	     	<*> YAFFS2 file system support //yaffs2文件系统,应用在NandFlash
  	     	< > Journalling Flash File System v2 (JFFS2) support//JFFS2文件系统的支持,常用在NorFlash,也能用在Nand上
  	     	< > Compressed ROM file system support (cramfs) //cramfs文件系统支持,Nor,Nand都支持
  	     
  	     [*] Network File Systems  --->//网络文件系统 	
  	     	 <*>   NFS client support 
  	     	 
  	     	 //此选项必须支持,否则内核无法采用NFS找到rootfs
  	     	 [*]   Root file system on NFS      
                 
                 <*>   NFS server support   
      
      2.最后看内核的一个重要的源码文件
        切记：此文件将来跟设备驱动还密切相关！
        cd /opt/kernel
        vim arch/arm/mach-s5pv210/mach-cw210.c //务必多多看！！！！！
        文件命名的规律：
        arch/arm/mach-处理器名/mach-开发板名.c
        此文件的修改,一定要结合芯片厂家的参考板和自己的板子
        的硬件差异进行修改即可！
        比如晶振：
      
        友情提示：如果软件没有问题,还是无法运行,一定要怀疑
        	  硬件是否出现毛病(硬件工程师协助调查)
        	  尝试更换一块开发板！

案例：熟悉内核启动参数的传递,采用内核自身传递
实施步骤：
PC机执行：
1.cd /opt/kernel
  make menuconfig
  Boot options  ---> 
  	      //光标移动到这个选项,回车进入进行修改为：
  	      root=/dev/nfs nfsroot=192.168.1.8:/opt/rootfs ip=192.168.1.110:192.168.1.8:192.168.1.1:255.255.255.0::eth0:on init=/linuxrc console=ttySAC0,115200
              (要修改的地方) Default kernel command string   	  
              
              //按Y选中此选项
              [ ]Always use the default kernel command string     	                 
  一路按exit退出,切记要保存
  结论：本质就把配置结果保存在.config隐藏文件中
  make zImage //无需在make distclean/make cw210_defconfig
  cp arch/arm/boot/zImage /tftpboot/
 
ARM开发板执行：
1.重启uboot,进入uboot的命令行执行
  setenv bootargs root=zhangsan
  saveenv
  setenv bootcmd tftp 20008000 zImage \; bootm 20008000 
  boot //启动系统
  观察内核是否挂接NFS网络文件系统
  如果系统启动完毕,shell执行：
  cat /proc/cmdline //查看当前内核的启动参数信息
  
友情提示：做完此实验,再改成uboot传递参数

4.问：make menuconfig菜单怎么弄？怎么样添加一个自己的选项？
  问：菜单选项如何跟最终的内核程序关联在一起？
  答：关键靠两个重要的文件：Kconfig和Makefile	
  4.1.明确：
  Kconfig文件用来添加自己的配置选项
  Makefile文件用来条件式编译内核程序
  
  4.2.Kconfig基本语法
  参考代码：
  config    HELLOWORLD
  	tristate "hello,world"
  	help
  		"this is a helloworld msg"
  说明：
  config关键字用来生成配置选项
   config HELLOWORLD:表示将来生成的配置选项为CONFIG_HELLOWORLD
  
  tristate关键字:表示将来这个选项的操作有三种方式(三态)：
           1.按Y,选择为*,结果将这个选项对应的内核程序
             和zImage编译器在一起(在一起)
           2.按M,选择为M,结果是将这个选项对应的内核程序
             不会和zImage编译在一起,单独编译(分家)
           3.按N,不选中,不编译对应的内核程序
           看到的效果就是"<>"
  bool关键字：类似tristate,只是它对应的配置选项的操作方式有2种(2态)：
        1.按Y,选择为*,结果将这个选项对应的内核程序
             和zImage编译器在一起(在一起) 
        2.按N,不选中,不编译对应的内核程序
           看到的效果就是"[]"   
        
        tristate "hello,world"：表明make menuconfig看到的选项提示字符串
  help关键字：提供选项的帮助说明 
  
  总结：
  make menuconfig //配置菜单
  保存退出,将配置结果保存在.config
  vim .config //结论：
  如果选择为*,结果CONFIG_HELLO_WORLD=y
  如果选择为M,结果CONFIG_HELLO_WORLD=m
  如果不选择,CONFIG_HELLO_WORLD=空
  
  问：以上的结果有何用？
  答：给Makefile使用,将来Makeifle文件根据结果条件式编译
      内核程序
      内核对应的Makeifle条件编译内核程序的语法：
      obj-$(CONFIG_HELLO_WORLD) += helloworld.o
      如果CONFIG_HELLO_WORLD=y：obj-y += helloword.o 在一起
      如果CONFIG_HELLO_WORLD=m：obj-m += helloword.o 单独编译
 
 结论：Kconfig的config关键字指定的配置选项是Kconfig和Makefile的
 一个桥梁！

案例：将LED设备驱动添加到内核源码,进行条件式编译
1.将LED设备驱动和zImage编译在一起      
实施步骤：
1.下载ftp://PORTING/led_drv.rar,LED驱动和测试程序
   led_drv.c:驱动程序
   led_test.c:测试程序 

2.拷贝驱动源码到内核源码中
  cp led_drv.c /opt/kernel/drivers/char/

3.做一个菜单选项
  cd /opt/kernel
  vim drivers/char/Kconfig 添加如下内容
  
  config  TARENA_LED
  (TAB键)tristate "tarena led driver"
  (TAB键)help
  		"this is my first led driver"
  
  心理念叨：
  将来.config文件中生成配置选项:CONFIG_TARENA_LED 
  菜单的提示信息：tarena led driver
  菜单的操作方式：三种 
  保存退出
  
  vim drivers/char/Makefile 添加驱动代码的编译 
  obj-$(CONFIG_TARENA_LED) += led_drv.o
  保存退出  
  
4.操作
  cd /opt/kernel
  make menuconfig
  可以按/键,输入TARENA_LED搜索到配置选项的位置
  找到位置以后,按Y选择为*
  保存退出
  vim .config //确保选中为*
  搜索CONFIG_TARENA_LED,是否为y
  
5.编译内核源码
  注意：会将led_drv.c和zImage编译在一起
  cd /opt/kernel
  make zImage
  cp arch/arm/boot/zImage /tftpboot

6.重启开发板,注意：采用NFS网络文件系统启动
  观察内核的启动信息,找到这么一句话：“this is my first led driver!“
  如果看到,说明led_drv.c被得到执行,也就说明LED驱动安装成功
  
7.测试LED驱动
PC机执行：
  cp led_test.c /opt/rootfs/
  cd /opt/rootfs/
  arm-linux-gcc -o led_test led_test.c

TPAD执行：前提是linux挂接NFS网络系统成功
  cd /
  ls 
     led_test
  ./led_test //友情提示,有可能灯不工作
  

2.将LED设备驱动和zImage分开编译
实施步骤：
1.操作内核,配置成M方式  
  cd /opt/kernel
  make menuconfig 	
  找到菜单的位置
  按M键,选择为M
  保存退出
  vim .config //确保CONFIG_TARENA_LED=m
  
2.先编译内核源码,再编译LED驱动
  cd /opt/kernel
  make zImage //单独编译内核,此时不会编译led_drv.c
  cp arch/arm/boot/zImage /tftpboot/
  
  make modules //单独将led_drv.c编译生成对应的模块文件
                 (二进制可执行文件)led_drv.ko
                 
  cp drivers/char/led_drv.ko /opt/rootfs
  
3.开发板验证
  用新zImage,重启开发板,启动以后执行：
  cd /
  ls 
     led_drv.ko led_test  
     驱动二进制  驱动测试程序
  死记：linux驱动安装/卸载的命令：insmod,rmmod
  insmod led_drv.ko  //安装led_drv.ko驱动到zImage中
  //同样能够看到打印信息”this is my first led driver!“
  ./led_test //启动应用程序
  按ctrl+c强制退出应用程序
  rmmod led_drv //卸载驱动
     		                    
```