```
回顾：
1.linux内核相关内容
  1.linux内核特点
  2.linux内核功能
  3.linux内核操作过程
案例：自行回顾Kconfig和Makefile
场景：某个开发板上有一个LM77温度传感器,目标需要编写LM77
      温度传感器的驱动(属于linux内核程序)！
      某程序员这么做：
      cd /opt/kernel
      make menuconfig //他想看看内核是否支持这个LM77
      按/键搜索关键字"LM77",结果这个程序员找到了对应的驱动
      源码?.c
      问：?.c,怎么找的？

2.明确嵌入式linux系统软件组成部分
  crosstools
  uboot
  kernel
  rootfs     

3.嵌入式linux系统软件之根文件系统
  3.1.根文件系统(又称rootfs)定义
  根文件系统rootfs仅仅是一个代名词而已！它不是具体的某种
  文件系统格式(ext3,ext4,ntfs,fat32,cramfs,yaffs2,jffs2等)      
  咱们平常说的文件系统,是指某种文件系统格式(ext3,ext4,ntfs,fat32,cramfs,yaffs2,jffs2等)
  不同的文件系统格式对文件的组织和管理不一样的(4G文件不能放在
  FAT32文件系统格式的磁盘上,可以放在NTFS文件系统格式的磁盘上)
  
  3.2.根文件系统rootfs包含内容
  本质就是装完linux系统以后,启动linux系统以后,执行命令：
  cd /;ls看到的内容都是rootfs的内容;也就是rootfs就是包含
  一大堆内容的集合！
  
  注意：rootfs包含的内容一分为二：
  必要的目录：
  	bin:存放普通用户的命令
  	sbin:存放超级用户的命令
  	etc:存放各种配置服务
  	usr:存放各种命令和动态库
  	lib:存放动态库
  	dev:存放硬件设备对应的设备文件
  	proc:作为procfs虚拟文件系统的入口
  	sys:作为sysfs虚拟文件系统的入口
  	
  可选的目录：
        mnt
        home
        root
        var
        ...
        里面存放的内容随意！
        
  3.3.再次明确嵌入式linux系统启动流程
  上电->uboot(bootcmd)->kernel(2个方法)->rootfs->
  linuxrc->/sbin/init(第一号进程)->sh(shell)->等待用户输入
  各种命令(cd,ls等)->动态库(都是有rootfs来提供)    
  
  3.4.问：rootfs从何而来？
  答：利用大名鼎鼎的开源软件busybox制作而成
  这里不建议使用芯片公司提供的rootfs,芯片公司提供的rootfs
  一般来说体积比较庞大,功能比较强悍,但是很多对你无用！
  建议大家用busybox自己制作！(体力活)
  
  3.5.busybox开源软件特点
  1.开源
  2.官方网站：www.busybox.net
  3.切记切记：busybox开源软件仅仅提供了各种命令(cd,ls等)
    但是动态库,各种服务配置等busybox不提供,需要额外自己添加！
    
  3.6.利用busybox制作rootfs的实施操作步骤：
  1.从ftp下载busybox源码：busybox-1.21.1.tar.bz2 
  2.解压缩
    2.1.windows解压缩一份,利用sourceinsight创建源码工程
    2.2.linux解压缩
    cp busybox-1.21.1.tar.bz2 /opt/
    cd /opt/
    tar -xvf busybox-1.21.1.tar.bz2
    mv busybox-1.21.1 busybox
  3.对源码进行操作(一般无需做验证)
    3.1.指定交叉编译器
    cd /opt/busybox
    vim Makefile 到164行：
    将CROSS_COMPILE修改为：CROSS_COMPILE=arm-linux- //指定交叉编译器
    
    再到189行：将ARCH修改为ARCH=arm //指定将来运行的架构为arm
    保存退出
    
    3.2.配置编译busybox
    cd /opt/busybox
    make menuconfig  //通过菜单配置busybox支持的命令
       Linux Module Utilities  ---> 
       	    [*] Simplified modutils  //去掉驱动操作命令的精简版本,冒出的是完整版本的命令
       	       //全选,完整的模块操作命令
       	    [*]   insmod                                                                      │ │  
  	    [*]   rmmod                                                                       │ │  
  	    [*]   lsmod                                                                       │ │  
  	    [*]     Pretty output                                                             │ │  
  	    [*]   modprobe                                                                    │ │  
  	    [*]     Blacklist support                                                         │ │  
  	    [*]   depmod  
      
      Miscellaneous Utilities  ---> 
      	    [*] nandwrite //去除nandwrite命令(此命令有问题)
      	    [*] nanddump  //去除
      
      保存退出
      
    make -j2/j4 //编译busybox
    切记切记：busybox编译的结果仅仅生成了一个二进制可执行文件
    busybox,其余各种linux命令(cd,ls)都是软连接文件,最终都
    连接到busybox可执行文件上！
    
    make install //将编译busybox生成的各种(busybox,软连接文件)二进制文件
                 拷贝到当前目录下的_install目录中
    
    cd _install
    ls //查看编译busybox生成的内容
       bin  sbin  usr  linuxrc     
      命令  命令  命令  调用/sbin/init
    
    ls bin/ls -lh 
    ls-->busybox //ls仅仅是一个busybox可执行文件的软连接
    
    3.3.添加必要和可选目录和必要的系统启动文件
    1.添加必要目录：
      rm /opt/rootfs -fr //删除原先的rootfs
      cd /opt/busybox	
      cp _install /opt/rootfs -frd //拷贝自己的rootfs   
      cd /opt/rootfs
      mkdir dev lib proc sys etc //创建必要目录
      mkdir mnt home var tmp //创建可选目录
      
    3.向rootfs添加应用程序运行时所需的动态库
      切记：动态库就在交叉编译器中找
      切记：如何知道一个应用程序需要哪些动态库呢？
      切记：标准的动态库都放在必要目录中的lib目录
      切记：linux动态库的命名规则:lib+名.so
      3.1.获取应用程序的动态库
      cd /opt/rootfs
      file bin/busybox //检查busybox二进制可执行文件的属性
                         关键看是否是ARM架构的二进制文件
      arm-linux-readelf -a bin/busybox | grep "Shared"
      说明：
      利用readelf命令读取可执行文件busybox的信息,将这些信息
      通过管道给grep命令,搜索信息中的字符串"Shared",就是
      查看需要的动态库
      格式：
      arm-linux-readelf -a 可执行文件 | grep "Shared"
      
      0x00000001 (NEEDED) Shared library: [libm.so.6]
      0x00000001 (NEEDED) Shared library: [libc.so.6]
      说明：busybox最终需要的动态库：libm.so.6和libc.so.6
      明确：这两个库肯定在交叉编译器中！
      
      小案例：自己编写一个UC程序,进行交叉编译,利用arm-linux-readelf
      获取应用程序的动态库
                        
      3.2.到交叉编译器中拷贝所需的动态库到
      cd /home/tarena/workdir/toolchains/opt/S5PV210-crosstools/4.4.6/
      find . -name libm.so.6 //在当前目录下找一个文件名为libm.so.6的文件
      查询结果：
      ./arm-concenwit-linux-gnueabi/concenwit/usr/lib/libm.so.6
      ls ./arm-concenwit-linux-gnueabi/concenwit/usr/lib/libm.so.6 -lh
      结论：libm.so.6仅仅是一个软连接(快捷方式)
      切记：不仅仅要拷贝软连接,还要拷贝实体文件
      cp ./arm-concenwit-linux-gnueabi/concenwit/usr/lib/libm.so.6 /opt/rootfs/lib -d
      cp ./arm-concenwit-linux-gnueabi/concenwit/usr/lib/libm-2.10.1.so /opt/rootfs/lib -d
      cp ./arm-concenwit-linux-gnueabi/concenwit/usr/lib/libm.so /opt/rootfs/lib -d
      
      依次拷贝标准C库：
      cp ./arm-concenwit-linux-gnueabi/concenwit/usr/lib/libc.so.6 /opt/rootfs/lib -d
      cp ./arm-concenwit-linux-gnueabi/concenwit/usr/lib/libc-2.10.1.so /opt/rootfs/lib -d
      cp ./arm-concenwit-linux-gnueabi/concenwit/usr/lib/libc.so /opt/rootfs/lib -d

      3.3.切记切记还有一个动态链接库(加载器)需要额外单独拷贝                                                          
          切记：加载器命令规则：ld-*(以ld开头,不是lib开头)
          切记：也同样在交叉编译器中
      cp ./arm-concenwit-linux-gnueabi/concenwit/usr/lib/ld-linux-so.3 /opt/rootfs/lib -d 	    
      cp ./arm-concenwit-linux-gnueabi/concenwit/usr/lib/ld-2.10.1.so /opt/rootfs/lib -d
       
      至此：busybox可执行文件所需的动态库全部拷贝完毕！
   
   4.添加系统启动的必要文件inittab,rcS,fstab
     4.1.添加inittab文件
     cd /opt/rootfs
     vim etc/inittab   //inittab文件位于必要目录etc下
     添加如下内容：
     ::sysinit:/etc/init.d/rcS
     ::respawn:-/bin/sh
     ::ctrlaltdel:/sbin/reboot
     ::shutdown:/bin/umount -a –r
     说明：inittab文件格式要求：
     console:runlevel:action:process
     嵌入式：console和runlevel省略
     process：表示对应的一个进程(程序)
     action关键字：sysinit,askfirst,respawn
     	sysinit:这个action对应的process将来第一个号进程
     	        init首先会去创建一个子进程去执行sysinit
     	        对应的process,子进程执行完毕之前,父进程等待
     	
     	askfirst等价于reapawn,它们都是晚于sysinit,每当
     	init进程执行完sysinit对应的process以后,最后init进程
     	再次创建一个子进程去执行askfirst或者respawn对应的
     	process,两者的区别在于askfirst对应的process在执行前
     	需要用户按回车键才能运行,后者无需用户按回车键,直接
     	执行对应的process
    
    整理系统启动流程：
    ::sysinit:/etc/init.d/rcS
    ::askfirst:-/bin/sh
    采用askfirst: 
    上电->uboot->kernel->rootfs->linuxrc->/sbin/init->
    init解析inittab文件->首先执行sysinit对应的程序/etc/init.d/rcS
    ->最后执行askfirst对应的程序/bin/sh,注意执行前先按回车键
    	        
    ::sysinit:/etc/init.d/rcS
    ::respawn:-/bin/sh //注意：“-”表示可交互,记住即可
    采用respawn: 
    上电->uboot->kernel->rootfs->linuxrc->/sbin/init->
    init解析inittab文件->首先执行sysinit对应的程序/etc/init.d/rcS
    ->最后执行respawn对应的程序/bin/sh,注意执行直接,无需按回车键    
    
    总结：inittab不是脚本,此文件由/sbin/init进程来解析
    
    4.2.添加必要的启动文件rcS(脚本)
    cd /opt/rootfs
    mkdir etc/init.d
    vim etc/init.d/rcS 添加如下内容：
    #!/bin/sh
    /bin/mount -a  
    mkdir /dev/pts
    mount -t devpts devpts /dev/pts
    echo /sbin/mdev > /proc/sys/kernel/hotplug
    mdev -s
    保存退出
    chmod 777 etc/init.d/rcS
    
    内容说明：
    mount -a:将来会自动解析fstab,根据此文件的要求进行一系列的挂接动作
    
    mkdir /dev/pts
    mount -t devpts devpts /dev/pts:用于远程登录telnet
    
    echo /sbin/mdev > /proc/sys/kernel/hotplug
    mdev -s:以上两句话用于自动创建设备文件
        
    注意：rcS脚本将来由第一号进程/sbin/init进程
          init进程的源码位于busybox/init/init.c
          入口函数为init_main    
   
    4.3.添加系统启动文件fstab(同样不是脚本)
    注意：此文件由rcS中的mount -a这个命令来解析
    cd /opt/rootfs
    vim etc/fstab //同样位于必要目录etc下,添加如下内容：
    文件格式：
    挂接设备       挂接点     文件系统格式      属性		属性
    proc           /proc        proc   		defaults        0     0
    tmpfs          /tmp         tmpfs  		defaults        0     0
    sysfs          /sys         sysfs  		defaults        0     0
    tmpfs          /dev         tmpfs  		defaults        0     0
    切记：以上四句话跟设备驱动中的设备文件的自动创建密切相关
    例如：
    proc           /proc        proc   		defaults        0     0
    说明：把procfs虚拟文件系统挂接到/proc目录
    切记切记：procfs,sysfs,tmpfs仅仅是三种文件系统格式
    类似NTFS,这种文件系统的内容都存在于内存中！！
    此目录下的内容由内核自动来创建！
  
    
    总结：至此最小根文件系统rootfs制作完成！
    
  5.获取最小根文件系统rootfs的大小
    du /opt/rootfs -lh  //查看rootfs的大小,3.2MB
  
4.利用NFS网络进行测试：
  重启开发板,进入uboot命令行执行：
  setenv bootargs root=/dev/nfs nfsroot=192.168.1.8:/opt/rootfs ...
  save 
  boot //启动嵌入式linux系统
  启动完毕以后执行：
  cat /proc/cmdline
  
5.添加应用程序的自启动功能
  PC机执行：
  cd /opt/rootfs 
  vim helloworld.c
  int main(void)
  {
  	while(1) {
  		printf
  		sleep(1);
  	}
  	return 0;
  } 
  arm-linux-gcc -o helloworld helloworld.c
  
  vim /opt/rootfs/etc/init.d/rcS 在此文件最后添加：
  cd /
  ./helloworld & //让helloworld后台运行,目的释放终端的控制权
  保存退出
  重启开发板,开发板启动以后,在开发板的linux的shell执行：
  ps  //查看helloworld的进程信息
    
************************************************************
3.问：如何将根文件系统rootfs烧写到Nand,将来让内核启动的时候
  去Nand上挂接(找)根文件系统rootfs呢？
  答：目标非常明确,只需将rootfs目录制作成对应的单个镜像文件
      然后利用uboot烧写即可
  
  问：如何制作呢？
  答：这里采用cramfs或者yaffs2文件系统
  
  问：如何实施？
  具体实施步骤如下：
  1.将根文件系统rootfs目录制作成cramfs文件系统格式的单个
    镜像文件rootfs.cramfs
    1.1.只需利用mkfs.cramfs工具制作即可
    cd /opt
    mkfs.cramfs rootfs rootfs.cramfs  
    说明：利用mkfs.cramfs将rootfs目录制作成单个镜像文件
          并且这个单个镜像文件里包含的文件将来访问时采用
          的文件系统格式为cramfs
    cramfs文件系统格式它是只读压缩文件系统！这种文件系统格式
    对于保护一些必要的数据非常有效！
    
    cp rootfs.cramfs /tftpboot
    
    1.2.切记：一定要让linux内核支持这种文件系统格式cramfs
        明确：文件系统由linux内核支持
    cd /opt/kernel
    make menuconfig
       File systems  --->
       	 [*] Miscellaneous filesystems  --->
       	 	< > Compressed ROM file system support (cramfs) //选中为*
    保存退出
    make zImage -j2/-j4
    cp arch/arm/boot/zImage /tftpboot
    
    1.3.烧写之前,切记切记一定要进行分区的划分
    0--------2M----------7M-----------17M----------剩余
      uboot     kernel       rootfs       userdata
      第一分区  第二分区    第三分区      第四分区
     mtdblock0 mtdblock1    mtdblock2     mtdblock3
      
    1.4.要让内核能够知道咱们的分区规划,只需修改内核的
        Nand分区表即可,分区表存在于Nand的驱动
    cd /opt/kernel
    vim drivers/mtd/nand/s3c_nand.c +40//打开Nand驱动
    将原先的分区表修改为如下：
    struct mtd_partition s3c_partition_info[] = {
    	//第一分区信息
    	{
		.name		= "uboot",//分区名
		.offset		= (0), //分区起始地址         
		.size		= (SZ_1M*2),//大小
	},
	//第二分区信息
	{
		.name		= "kernel",
		.offset		= MTDPART_OFS_APPEND,//追加
		.size		= (5*SZ_1M),
	},
	//第三分区信息
	{
		.name		= "rootfs",
		.offset		= MTDPART_OFS_APPEND,
		.size		= (10*SZ_1M),
	},
	//第四分区信息
	{
		.name		= "userdata",
		.offset		= MTDPART_OFS_APPEND,
		.size		= MTDPART_SIZ_FULL,//剩余
	}
    };
    保存退出
    make zImage -j2/j4
    cp arch/arm/boot/zImage /tftpboot
        
  2.万事俱备,接下来烧写(uboot的tftp和nand erase/write)
    2.1.重启开发板,进入uboot命令行执行：
    tftp 50008000 rootfs.cramfs
    nand erase 700000 a00000
    nand write 50008000 700000 a00000
    
    2.2.设置内核的启动参数,告诉内核,根文件系统不再采用
        NFS,而是在Nand的第三分区
    setenv bootargs root=/dev/mtdblock2 init=/linuxrc console=ttySAC0,115200 rootfstype=cramfs
    saveenv
    boot
    启动系统以后,进入linux的shell命令,执行
    cat /proc/cmdline
    ps //查看helloworld的PID
    kill helloworld的PID
    cd /
    mkdir hello //能够创建成功？
 
2.将根文件系统rootfs目录制作成yaffs2文件系统格式的单个
    镜像文件rootfs.yaffs2
  2.1.明确yaffs2特点：可读可写文件系统,非压缩,适用于Nand
  2.2.利用mkyaffs2image工具将rootfs制作成单个镜像文件
      从ftp下载工具mkyaffs2image
      sudo cp mkyaffs2image /sbin/   
      sudo chmod 777 /sbin/mkyaffs2image
      cd /opt
      mkyaffs2image rootfs rootfs.yaffs2 //目录->镜像
      chmod 666 rootfs.yaffs2
      cp rootfs.yaffs2 /tftpboot
      
  2.3.让linux内核支持yaffs2文件系统格式   
  cd /opt/kernel
  make menuconfig
  File systems  ---> //文件系统支持
     [*] Miscellaneous filesystems  --->  
  	 <*> YAFFS2 file system support //yaffs2文件系统,应用在NandFlash    
  提示：看看即可
  make zImage -j2/j4
  cp arch/arm/boot/zImage /tftpboot
  
  2.4.烧写之前一定要记得进行分区规划：
     0--------2M----------7M-----------17M----------剩余
      uboot     kernel       rootfs       userdata
      第一分区  第二分区    第三分区      第四分区
     mtdblock0 mtdblock1    mtdblock2     mtdblock3       
  2.5.省略修改分区表
  2.6.烧写yaffs2文件系统镜像到Nand
      重启开发板,进入uboot,执行：
      tftp 50008000 rootfs.yaffs2
      nand erase 700000 a00000
      nand write.yaffs 50008000 700000 $filesize
      或者：
      nand write.yaffs 50008000 700000 $(filesize)
      
      设置启动参数：
      setenv bootargs root=/dev/mtdblock2 init=/linuxrc console=ttySAC0,115200 rootfstype=yaffs2
      saveenv
      boot
      
      linux系统启动以后,执行：
      cat /proc/cmdline
      ps
      cd /
      mkdir hello //能否创建呢？
      
友情提示：做完这两个实验,最终再改回到采用NFS启动！

切记：
NFS网络文件系统特别适用于产品的研发测试！
cramfs/yaffs2/jffs2/ramdisk/ubifs/ext4适用于产品最后发布！

    
    
    
  
  
  
  
```