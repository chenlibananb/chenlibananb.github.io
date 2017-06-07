```
第二阶段任务安排：
1.嵌入式linux系统开发环境搭建
2.嵌入式linux系统软件之uboot
3.嵌入式linux系统软件之linux内核
4.嵌入式linux系统软件之根文件系统
5.嵌入式linux系统部署

一.嵌入式linux系统开发环境搭建
   场景：小陈通过上班第一天,老板给他一块开发板,说：“给一周
   	 时间,熟悉开发板,并且把linux系统在开发板运行起来”
   面试题：谈谈对嵌入式linux软件设计的理解
   实施步骤：
   1.安装纯linux系统
     ubuntu/fedora
   2.安装必要的开发工具
     sudo apt-get install vim+vim插件+vim配置文件
     sudo apt-get install minicom ckermit
     sudo apt-get install tftpd-hpa
     sudo apt-get install nfs-kernel-server
     sudo apt-get install ctags cscope
     sudo apt-get install gcc g++ automake //需要什么装什么
     sudo apt-get install openssh-server
     sudo apt-get install qt4  qtcreator  
   3.明确嵌入式linux系统开发基本模式
     上位机+下位机
     1.硬件连接
       电源线
       UART线：用于打印调试,不建议用来下载软件   
               必须要有
       网线或者USB线：就是用来下载软件,建议采用网线
       立马检查开发板是否有以上接口！
       
     2.掌控基本的开发板的硬件信息("把玩")
       粗看：
       	    三大件[^1]
       	    外设
       	    边看边记录
       细看：
       	   原理图：咨询硬件工程师
       	   芯片手册：自己慢慢研究,记住章节的名称即可
       	   硬件资料：一般都是由芯片厂家或者开发板的厂家提供
       	             有的是公司内部的硬件工程师提供！
       	             
    4.内心一定要明确嵌入式linux系统软件的组成部分
      bootloader,linux内核zImage,根文件系统rootfs
       
    1.bootloader(统称),普遍使用uboot
      bootloader = boot + loader
      注意：裸板的shell,起始就是一个最最简单的bootloader
      基本功能：
      1.做硬件初始化工作
        初始化CPU
        初始化内存
        初始化闪存
        初始化外设
        等
        此阶段就是boot阶段
        初始化硬件的本质目的就是为运行linux系统准备适合的
        硬件唤醒而已！
        
      2.一旦硬件初始化完毕,从"某个"地方加载linux内核
        到内存,并且将内核从内存中启动
        此阶段又称loader阶段  	             
       	    
      3.bootloader类似PC机的BIOS 	   
       		
    2.linux内核zImage,又称操作系统内核
      linux内核七大功能(七大子系统)：
      1.内存管理子系统
        例如：malloc/sbrk...
        具体内存的分配,内存的释放,内存地址的映射等待
      
      2.进程管理子系统
        进程的创建,进程的销毁,进程的切换,进程的抢占调度
        ,进程间的通信等
      
      3.网络协议栈
        TCP/IP协议栈 
      
      4.系统调用
        本质：就是应用程序和内核操作系统通信的唯一途径
        open/close/read/write/mmap/sbrk/socket/fork/exit/...
      
      5.设备驱动
        管理硬件外设
        
      6.文件系统
        FAT32,NTFS,NFS,YAFFS2,CRAMFS,JFFS2,UBIFS...
        不同的文件系统对文件的组织和管理不一样滴
        
      7.平台代码
      问：为什么linux能运行ARM开发板上？
      答：因为linux内核有ARM开发板的软件代码
       
      总结：内核就像一个"大管家"(能干很多事情),
      	    又像"服务器"(能够相应用户的请求) 
        
     3.根文件系统rootfs(root + file system) 
       各种命令:cd,ls,mkdir,cp,touch,等
       各种应用程序
       各种标准应用软件库：C库,C++库等
       各种配置文件/etc/default/tftpd-hpa等
       都属于rootfs
       本质：进入linux系统执行:cd /; ls 你看到的东西
       都是rootfs的内容
       
       
   5.明确了嵌入式linux系统软件的组成部分以后,明确
     嵌入式linux系统的启动过程
   5.1.明确：软件运行在内存RAM中
             软件存储在Nand上
   5.2.画出嵌入式linux系统的启动流程图
   启动流程：
   ”挂接“ = ”找“
   1.CPU上电以后,首先自动将Nand的0地址开始的uboot
     拷贝到内存中运行
   2.一旦uboot运行,uboot将Nand上的zImage全部拷贝到
     内存中,然后启动zImage
   3.zImage启动完毕,最后去挂机Nand上的rootfs
     rootfs上的东西并不会一次性拷贝到内存上
     用到什么软件那就拷贝什么软件到内存
   4.如果有第四分区(music),rootfs还可以挂接第四分区(music)
     一旦挂接成功,将来运行music,还是一样,将music拷贝到
     内存中,注意：不是一次性全部拷贝！
   
   切记：uboot的存储位置不能变！
         但是zImage,rootfs,music位置随意改变！
         但一般来说存储：
         uboot->zImage->rootfs->music
         关键保证uboot能够找到zImage
         zImage能够找到rootfs
         rootfs能够找到music即可！
 
 6.将三部分软件烧写到Nand上
   明确：一般来说,官方给定的资料中都有已经制作好的
         三部分对应的二进制文件,接下来利用uboot+网络tftp
         烧写zImage和rootfs即可
 
 案例：向TPAD烧写Android操作系统
 实施步骤：
 1.从ftp://PORTING/下载烧写的软件镜像
   day01_image.rar,解压缩得到两个目录：
   android_system: 文件说明
   	u-boot_menu.bin:uboot二进制镜像,带菜单,相当难用
   	u-boot_nomenu.bin:uboot二进制镜像,不带菜单
   	友情提示：就不要再烧写uboot
   	zImage:linux内核二进制镜像
   	rootfs_android.bin:根文件系统二进制镜像
   	logo.bin:系统启动logo

 2.将镜像文件拷贝到linux虚拟机
   cp android_system/*  /tftpboot
 
 3.烧写之前,对Nand进行分区的划分
   0M------1M------2M------5M------10M-------剩余
    uboot    隐藏    logo   zImage    rootfs
   第一分区        第二分区 第三分区  第四分区
   mtdblock0       mtdblock1 mtdblock2 mtdblock3
   
 4.重启开发板,进入开发板的uboot命令行模式,执行：
   //uboot自己更新自己,建议别做了！
   tftp 50008000 u-boot_nomenu.bin
   nand erase 0 200000
   nand write 50008000 0 200000
   
   tftp 50008000 logo.bin
   nand erase 200000 300000
   nand write 50008000 200000 300000
   
   tftp 50008000 zImage
   nand erase 500000 500000
   nand write 50008000 500000 500000
   
   tftp 50008000 rootfs_android.bin
   nand erase a00000  //将剩余全部擦除
   nand write.yaffs 50008000 a00000 $filesize
   或者
   nand write.yaffs 50008000 a00000 $(filesize)
   
   问：uboot是CPU自动找到运行
       zImage如何让uboot找到呢？
       rootfs如何让zImage找到呢？
   答：利用uboot非常非常有名的两个参数：
       bootcmd:uboot将来利用bootcmd,能够将内核zImage从
       	       "某个"地方加载到内存,并且启动内核
       bootargs:内核起来以后,根据uboot传递的bootargs参数
                内核去到"某个"地方找(挂接)rootfs
           
 5.同样在uboot的命令行继续执行：
   setenv bootcmd nand read 50008000 500000 500000 \; bootm 50008000
   说明：设置环境变量bootcmd
         将内核从Nand的5M开始,读5M到内存0x50008000
         然后利用bootm启动内核
   注意：重启开发板以后,别按空格键,倒计时3秒以后,uboot
         自动执行bootcmd对应的命令
   
   setenv bootargs root=/dev/mtdblock3 init=/init console=ttySAC0,115200
   说明：设置bootargs环境变量
   root=/dev/mtdblock3:告诉内核咱的rootfs在Nand的第四分区
   init=/init:一旦挂接rootfs成功,启动运行的第一号进程init进程
   console=ttySAC0,115200:指定系统打印输出终端用第一个串口ttySAC0
   切记：此参数不是给uboot用,给内核zImage使用！
   
   saveenv 
   重启开发板,不进行任何按键操作,静静等待TPAD显示屏显示
   Android主界面
   
  6.启动流程：
  上电->uboot->uboot根据bootcmd->zImage->根据bootargs
  找rootfs(第四分区)         
   
        
               
          
                 
--------
脚注：
[^1]:三大件指CPU、内存、闪存         
     
     
   
   

```