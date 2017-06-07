```
回顾：
1.中断处理过程
  面试题：谈谈对中断的理解
2.嵌入式linux系统相关内容
  场景：给一块开发板,如何将linux系统运行起来
  2.1.搭建上位机(PC)开发环境
      安装linux系统
      安装必要的开发工具
  2.2.明确：嵌入式linux开发模式
      上位机+下位机+UART+网络(USB)
  2.3.明确：开发板的基本硬件信息
      运气好：有开发板硬件的说明文档
      原理图+芯片手册
  2.4.明确：嵌入式linux软件组成部分和功能
      bootloader(uboot)：
      	1.硬件初始化
      	  "硬件"：只初始化必要的硬件信息
      	          必要的硬件：三大件+UART+网络/USB
      	          有些硬件是否需要再次阶段进行初始化,
      	          关键看用户的需求,例如：用户想在系统上
      	          电以后,LCD显示屏上出现一个logo,此时
      	          uboot就必须要初始化LCD显示屏;
      	          如果对于无线路由器,本身就没有LCD显示屏
      	          压根就无需做LCD显示屏的初始化工作
      	   本质：一旦uboot将内核引导启动以后,uboot的生命周期
      	         结束,uboot所做的硬件初始化对于内核来说是没有用途的
      	         内核会重新对所有的硬件进行初始化(设备驱动)       
      	          	
      	2.从"某个地方"加载内核到内存
      	  并且从内存将内核启动
      	  对于uboot来说,加载启动内核关键靠bootcmd参数
      	  bootcmd:uboot根据bootcmd从某个地方将内核加载
      	  到内存中,启动内核bootm ....
      	  
      	  
      linux内核zImage:大管家/服务器
      	记住linux内核七大子系统/七大功能
      关键要利用uboot提供的bootargs去"某个地方"挂接(找)rootfs
      	
      根文件系统rootfs：就是一堆应用软件和库,配置文件等的集合
      cd /; ls 看到的东西都是rootfs内容
      	
  2.5.明确：嵌入式linux系统的启动过程
      明确：软件一般存储在闪存(Nand/Nor)
            运行在内存
      上电->CPU自动到Nand 0地址找到uboot->将uboot拷贝到
      内存中->uboot运行->uboot根据bootcmd指定的命令将
      内核从某个地方拷贝到内存中->bootm启动内核->
      内核启动(uboot game over)->内核启动根据bootargs
      去挂接rootfs(存在与某个地方)->一旦挂接rootfs成功->
      内核执行用户第一个进程init->init进程启动sh进程(shell)
      ->等待用户的命令输入：ls
      
      画出启动流程图
  
  2.6.烧写(=固化=部署)三部分软件到下位机
     1.获取要烧写的三个软件镜像文件(单个二进制文件)
       获取=从芯片厂家或者开发板厂家获取索要即可
     2.难题：先烧uboot
             烧写uboot关键要看芯片公司提供了怎样的烧写方法
       后面软件的烧写要利用uboot提供的tftp命令和网络进行
       下载烧写(烧写速度最快)   
     3.切记：烧写之前一定要进行分区的规划
       0-----xxx--------xxx---------xxxx---------xxx
        uboot    zImage     rootfs         xxxx
     4.tftp xxx xxxx
       nand erase xxx xxx
       nand write xxx xxx xx 
     
案例：烧写普通linux系统到TPAD
实施步骤：
1.从ftp获取普通linux系统的镜像文件
  normal_system:
  	u-boot_nomenu.bin
  	u-boot_menu.bin
  	zImage
  	rootfs.cramfs

2.拷贝镜像文件到虚拟机
  cp normal_system/* /tftpboot/
  
3.烧写之前记得要进行Nand的分区规划
  0-------2M---------7M----------17M----------剩余
   uboot     zImage     rootfs       暂且不用
   mtdblock0 mtdblock1 mtdblock2
   第一分区  第二分区   第三分区
   
4.启动开发板,进入uboot的命令行模式，执行：
  tftp 50008000 zImage 
  nand erase 200000 500000
  nand write 50008000 200000 500000
  
  tftp 50008000 rootfs.cramfs
  nand erase 700000 a00000
  nand write 50008000 700000 a00000
  
5.部署完毕,记得要设置系统启动参数
  setenv bootcmd nand read 50008000 200000 500000 \; bootm 50008000
  setenv bootargs root=/dev/mtdblock2 init=/linuxrc console=ttySAC0,115200
  saveenv
  说明：
  root=/dev/mtdblock2:告诉内核,将来你要挂接的rootfs在Nand的
                      第三分区上
  init=/linuxrc:内核挂接rootfs成功以后,内核执行的第一个用户
  	进程为linuxrc，linuxrc最终调用init进程			
       注意：init=/linuxrc也可以这么写：init=/sbin/init
  
6.重启开发板,观察串口的系统启动信息
  提示：Please Enter ....active console //按回车进入shell终端
  #ls
  #cd /
  #mkdir helloworld //看是否能够创建一个目录
  #./helloworld  //运行一个应用程序
  总结：至此开发板上启动了一个真正的linux系统
  
       
案例：问：如何在开发板上运行自己的应用程序
实施步骤：
1.明确：前提是咱们已经在开发板上固化了普通的linux系统
2.在虚拟机linux中构建一个rootfs,执行：
  mv /opt/rootfs /opt/rootfs_bak //备份以前的rootfs
  cp /home/tarena/workdir/rootfs/rootfs /opt -frd
  注意：此时/opt/rootfs是一个目录
  结论：/opt/rootfs就是咱们的根文件系统
  
3.在虚拟机linux编辑编译一个简单的UC程序
  cd /opt/rootfs/
  vim helloworld.c //随便写
  #include <stdio.h>
  int main(void)
  {
  	while(1) {
  		printf("hello,world\n");
  		sleep(1);
  	}
  	return 0;
  }  
 保存退出
 gcc helloworld.c //生成a.out只能运行在linux虚拟机中
 arm-linux-gcc -o helloworld helloworld.c //生成的helloworld能够运行在开发板

4.掌握NFS网络文件系统(本质利用NFS网络服务,比tftp强悍)
  思路：原先内核启动以后,根据bootargs的root=/dev/mtdblock2
  自动去挂接Nand上第三分区的rootfs,现在也可以利用NFS网络
  服务,让内核去挂接虚拟机linux中的rootfs,要实现这个功能
  涉及两个重要的技术难点：
  1.如何在linux虚拟机中启动NFS网络服务
  2.如何在bootargs中添加启动参数让TPAD去挂接linux虚拟机中
    的rootfs
  总结：
  “从某个地方”：从Nand上或者从Linux虚拟机中
  具体实施步骤：
  1.在linux虚拟机中启动NFS网络服务
    如果是自己安装的linux系统:
    sudo apt-get install nfs-kernel-server //安装NFS网络服务器
    sudo vim /etc/exports 在文件最后添加如下内容：
    /opt/rootfs *(rw,sync,no_root_squash)
    说明：如果采用NFS网络服务,/opt/rootfs就是共享目录
          将来TPAD可以去挂接
          *：任何ip都可以挂接
          rw:对rootfs可以进行读和写
          no_root_squash:任何用户都可以访问
    保存退出
    sudo /etc/init.d/nfs-kernel-server restart //重启NFS网络服务
    至此：linux虚拟机的NFS网络服务搭建OK
    友情提示：达内虚拟机已经安装好了NFS网络服务,只需做
    修改/etc/exports即可
    
   2.TPAD挂接linux虚拟机的/opt/rootfs共享目录的方式1：
     2.1.首先启动已经烧写linux系统的TPAD
         进入shell终端
     2.2.在开发板上执行：
         ifconfig eth0 192.168.1.110 //给TPAD配置一个ip地址
         ifconfig lo 127.0.0.1
         ping 192.168.1.8 //TPAD ping linux虚拟机
         mount -t nfs -no nolock 192.168.1.8:/opt/rootfs /mnt
         说明：
         mount:挂接命令
         -t nfs:采用NFS网络服务,NFS网络文件系统(类似NTFS)
         192.168.1.8:/opt/rootfs:挂接linux虚拟机的/opt/rootfs共享目录
         /mnt:就是将linux虚拟机的/opt/rootfs挂接到开发板的
         mnt目录,结果是将来在开发板上访问mnt目录就是
         在访问linux虚拟机的/opt/rootfs
         
         结论：挂接完毕,将来访问开发板的/mnt目录就是在
         访问linux虚拟机的/opt/rootfs
         
         cd /mnt //本质是进入了linux虚拟机的/opt/rootfs
         ls
           helloworld
         ./helloworld  //运行linux虚拟机的/opt/rootfs目录下的
         可执行程序
         
         切记：利用NFS网络服务,便于软件的调试！
               将来无需频繁的烧写Nand
          
    3.TPAD挂接linux虚拟机的/opt/rootfs共享目录的方式2：
      3.1.重启TPAD,进入uboot命令行,执行：
      setenv bootargs root=/dev/nfs nfsroot=192.168.1.8:/opt/rootfs 
               ip=192.168.1.110:192.168.1.8:192.168.1.1:255.255.255.0::eth0:on
               init=/linuxrc console=ttySAC0,115200
      saveenv
      说明：将来内核启动以后,给内核传递参数,告诉内核不要挂接
            Nand上的根文件系统,而是要挂接linux虚拟机的根文件系统/opt/rootfs
      root=/dev/nfs:采用NFS网络服务
      nfsroot=192.168.1.110:将来给TPAD配置的新的ip地址
              192.168.1.8:linux虚拟机的ip
      
      setenv bootcmd tftp 50008000 zImage \; bootm 50008000
      saveenv
      说明：将来uboot根据bootcmd直接从linux虚拟机下载内核
      到内存,启动内核
      
      切记：这种开发模式,发现完全没有对Nand进行读和写
            大大提高了Nand使用使命
      
      boot  //直接启动系统
      进入linux的shell终端
      ls
        helloworld //肯定是位于linux虚拟机的/opt/rootfs
      ./helloworld 

总结：如果uboot的启动参数为：
bootcmd=tftp 20008000 zImage ; bootm 20008000
bootargs=root=/dev/nfs nfsroot=192.168.1.8:/opt/rootfs ip=192.168.1.110:192.168.1.8:192.168.1.1:255.255.255.0::eth0:on init=/sbin/init console=ttySAC0,115200      

启动过程：
上电->运行uboot->uboot根据bootcmd,从linux虚拟机中的/tftpboot
目录中下载zImage到TPAD的0x20008000内存地址->bootm 20008000
启动内核->内核根据uboot传递的bootargs挂接rootfs->此时此刻的
rootfs不再Nand,而是在ip地址为192.168.1.8的linux虚拟机
并且在这个linux虚拟机的/opt/rootfs->挂接rootfs成功以后->
执行rootfs/sbin/init进程            
            
总结：
采用方式1挂接：
在TPAD的linux命令行输入：
mount -t nfs -o nolock 192.168.1.8:/opt/rootfs /mnt
就是将linux虚拟机的/opt/rootfs目录挂接到当前开发板的mnt目录
cd /mnt 等价于进入linux虚拟机的/opt/rootfs

采用方式2挂接：
setenv bootargs root=/dev/nfs nfsroot=192.168.1.8:/opt/rootfs ...
内核启动以后,去挂接linux虚拟机的/opt/rootfs，一旦挂接成功
进入开发板的linux命令行执行：
cd / : "/"就是linux虚拟机的/opt/rootfs

***********************************************************
2.切记：嵌入式linux系统软件的组成部分：
  bootloader:u-boot.bin
  zImage
  rootfs.cramfs
  问：以上三个软件从何而来？
  答：这三个软件都是著名的开源软件
  
2.1.bootloader中的uboot
面试题：谈谈对uboot的理解
1.明确：bootloader是个统称
        uboot属于其中一种

2.uboot的特点
  1.著名的开源软件
    属于德国denx小组
    官方网站：ftp://denx.xxx
  2.支持多种架构
    X86
    powerpc
    mips
    arm
    fpga+arm:厂家xilinx
    dsp+arm：TI(达芬奇)
  3.支持引导多种操作系统
    linux
    vxworks
    qnx
  4.支持多种多样的硬件开发板
    明确：硬件依赖用户需求
          软件依赖硬件
          uboot作为软件,必须要依赖硬件
     举例子：用s5pv210同一款处理器分别做手机和无线路由器

3.uboot功能
  明确：uboot两大基本功能
  1.硬件初始化
    问：开发板上的硬件是否都需要进行初始化呢？
    答：不一定
    uboot必须初始化的硬件：
    1.初始化CPU(ARM核)
      初始化cache(指令cache和数据chache)
    2.如果此处理器支持多种启动方式
      还要判断目前采用哪种启动方式(Nand,SD,USB,UART)
    3.初始化内存RAM
    4.初始化闪存Nand
    5.初始化调试UART
    6.初始化系统时钟
      一般就是进行PLL(时钟倍频)
      计算机一般时钟源都是晶振24MHz,如果让CPU工作在1GHz
      需要处理器的PLL将时钟频率进行放大倍数      
    7.关闭看门狗(集成在处理器内部,硬件)
      uboot关闭看门狗主要是为了防止系统启动的时候不断重启
      
      利用看门狗能够防止软件死机造成整个系统的死机
      利用看门狗能够产生一个很稳定,有规律的定时器中断
      例如：给看门狗硬件设置一个超时时间为5秒,一旦设置
      完毕(喂狗),看门狗硬件就开始倒计时(5,4,3...),如果
      超时时间到期(0),看门狗硬件会自发给CPU发送一个
      复位信号或者定时器中断信号,如果不想复位,只需在倒计时
      到0时前喂狗(重新设置一个新的超时时间)
      
      实际使用步骤：
      开启一个喂狗的程序,定义执行喂狗,如果一旦发现系统
      死机,喂狗程序也就game over,喂狗也会失败,最终发生
      复位！
     
    8.禁止中断
      不想在系统启动的时候,让系统处理中断 
      因为如果系统启动的时候处理中断,会影响系统的启动速度
      
    uboot可选初始化的硬件:
    可以初始化网络(建议),用来下载软件比较快
    还可以初始化USB
    还可以初始化LCD,前提需要显示logo,提高用户体验度
    还可以初始化按键,前提需要组合按键功能,实现硬件的自检功能,软件刷机功能
    ....
    总之一句话：哪些硬件需要进行初始化,完全根据用户的
    实际需求来定
    
    切记：这个硬件是否需要进行初始化,关键依赖用户的实际需求
    举例子：手机和无线路由器是否需要显示logo为例
    手机启动时必须要显示logo,为了提高用户的体验度
    无线路由器压根就不需要logo,因为没有接LCD显示屏
    所以：手机的uboot需要初始化LCD
          WIFI就无需初始化LCD
          
  2.加载启动linux操作内核       
    根据uboot的bootcmd环境变量进行加载启动：
    setenv bootcmd nand read 20008000 200000 500000 \; bootm 50008000
    或者
    setenv bootcmd tftp 20008000 zImage \; bootm 20008000
    如果在产品的前期研发阶段,使用第二种,便于调试zImage
    如果在产品的最后发布阶段,使用第一种,便于使用
    
    最后还要给内核传递启动参数,告诉内核根文件系统rootfs在哪里？
    setenv bootargs root=/dev/mtdblockXXX ...
    或者
    setenv bootargs root=/dev/nfs ...
    如果在产品的前期研发阶段,使用第二种,便于调试软件(驱动,应用程序)
    如果在产品的最后发布阶段,使用第一种,便于使用
    
  3.注意：
    1.uboot的终极使命就是为了启动引导操作内核
    
    2.一旦内核启动,uboot的生命周期结束
      uboot做很多复杂的硬件初始化,没用！因为将来内核
      一旦起来,还会重新对硬件进行初始化和操作(驱动程序的作用)
      
    3.uboot不要做乱七八糟无价值(用户需求)的事情,uboot
    它的执行速度尽可能要快,整个系统启动的时间就快

4.回归：问：u-boot.bin二进制从何而来
  1.需要有源码
  2.需要编译
  3.需要交叉编译器
  
  结论：
  4.1.切记：在上位机linux系统中,一定要部署一个合适的
            交叉编译器
      一般来说,交叉编译器的获取途径有四种：
      1.交叉编译器一般都由芯片公司或者开发板厂家提供
      2.从开源的ARM交叉编译器的官方网站去下载
        作业：找到这个网址
      3.利用crosstool-ng自动化制作脚本来自己制作交叉编译器
      4.自己DIY,自己下载gcc,g++等源码,自己编译(痛苦)
      切记：最好采用第一种！
      
      切记：交叉编译器的版本要适合(不能太新,太旧)！
      QT-4.8.4编译器版本要求4.4.6,4.4.1这个编译器太旧！
  
  案例：在上位机linux系统中部署版本为4.4.6的交叉编译器
  提示：
  达内虚拟机,交叉编译器的路径：
  cd /home/tarena/workdir/toolchains/opt/S5PV210-crosstools/4.4.6/    
  ls
    bin //存放arm-linux-gcc命令
  sudo vim /etc/environment  
  在PATH中添加/home/tarena/workdir/toolchains/opt/S5PV210-crosstools/4.4.6/bin即可
  保存退出
  重启虚拟机
  arm-linux-gcc -v //查看是否4.4.6验证一下
  
  自己的linux系统同学注意：
  需要将4.4.6目录先压缩再拷贝,拷贝自己的linux再解压缩
  千万别再windows下解压缩！
  
  //压缩：
  tar -jcvf xxx.tar.bz2 xxx
  tar -zcvf xxx.tar.gz xxx
  
  //解压：
  tar -jxvf xxx.tar.bz2
  tar -zxvf xxx.tar.gz
  
  4.2.获取uboot源码
      切记：uboot源码从芯片厂家
      为什么：要给用户提供好的服务
      三星提供的基于S5PV210处理器的参考板(公板)SMDKV210,
      uboot源码：u-boot_CW210_1.3.4.tar.gz
      目前咱们使用的开发板名为CW210,CW210开发板的祖先就是
      三星的SMDKV210
      
      参考板芯片公司提供,芯片公司也提供相应的参考板所有的
      软件代码！
      
      芯片厂家一般给用户提供源码途径：
      1.通过芯片厂家自己的网站提供
        从网站下载即可
      2.芯片厂家将源码放在github源码托管网站
        作业：浏览github.com
      3.从开发板厂家来获取(根本还是从芯片厂家)
  
  4.3.源码操作
      
        
      
  
  
          
      
      
      
      
              
  
















    					 
 
 
 
 
 
 
 
 


  
  
      
```