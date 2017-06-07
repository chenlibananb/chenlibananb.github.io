```
回顾：
1.uboot相关内容
  面试题：谈谈对uboot的理解
  1.1.明确uboot应用在嵌入式linux系统中
      嵌入式linux软件组成部分：
      uboot
      zImage
      rootfs
  1.2.uboot特点
  1.3.uboot功能
  1.4.uboot操作
      1.交叉编译器
      2.获取uboot源码
          芯片公司官方网站
          github
          ctags或者sourceinsight创建源码工程
          验证式编译
          	解压
          	make distclean
          	make xxx_config //xxx:开发板的名称
          	例如：xilinx的FPGA(内置ARM核)
          	      处理器型号：zynq
          	xilinx基于zynq参考板：zedboard  
          	make
          	结果：u-boot.bin
              	尝试将u-boot.bin下载自己的开发板上运行一下
              	官方的uboot源码肯定能运行官方的参考板上
      3.如果无法运行,此时需要进行uboot代码级调试：
        3.1.找到自己的板子和参考板之间的硬件差异(硬件工程师协助)
        zedboard：硬件信息
        	处理器：zynq(fpag核+ARM核(cortex-A9,双核))
        	内存：基地址0x0
        	      大小：1GB
        	NorFlash:基地址0x10000000
        	         大小512MB
        	SD卡
        	按键
        	调试UART:UART0,时钟频率33333333Hz
        	等
       自己的板子：硬件信息
       		处理器：zynq(fpag核+ARM核(cortex-A9,双核))
        	内存：基地址0x0
        	      大小：256MB
        	NorFlash:基地址0x20000000
        	         大小256MB
        	调试UART:UART0,时钟频率40000000Hz
        	USB口：接U盘
       3.2.根据硬件的差异进行有针对性的修改uboot源码
       一定要先看重要的头文件:include/configs/xxx.h 
       如果有必要去看源码：
       首先要明确uboot运行的第一个文件和入口：u-boot.lds(观察编译源码最后的链接信息)
       结论：start.S文件(一般不做修改), _start入口
             跳转C处理阶段：start_armboot
                            重点关注就是其中的各种硬件的初始化
                            例如:serial_init
       
       3.3.修改代码不代表还能正常运行,有可能还是有问题,
           建议更换开发板,有可能硬件电路出现问题(虚焊,芯片烧毁)
           需要对uboot代码进行调试：
           1.点灯调试
             加入点灯到某个地方失败了,说明这个地方有问题
             首先检查代码是否有问题,如果代码没有问题
             看这个代码操作的外设时哪个外设,确定是否是
             硬件的问题
             
           2.通过UART调试,前提是初始化UART

2.uboot命令实现过程(仅作了解)
  2.1.熟练掌握uboot常用的命令：
  1.print //打印环境变量,切记几个重要的环境变量
    server
    ipaddr
    bootcmd
    bootargs
    
  2.setenv / saveenv
  
  3.nand erase/nand write/nand read
  
  4.tftp / go / reset / ping
  
  5.mw/md：非常棒的测试外设的命令
    查看命令帮助：help mw : 写外设
                  help md : 读外设
    案例：测试内存
    mw.l 0x20008000 0x55555555 1
    md.l 0x20008000 1
    
    案例：读取Nand的ID信息
    mw.b 0xB0E00008 0x90 1  
    mw.b 0xB0E0000C 0x00 1
    md.b 0xB0E00010 1        
    md.b 0xB0E00010 1
    md.b 0xB0E00010 1
    md.b 0xB0E00010 1
    md.b 0xB0E00010 1              
       	
    案例：开关灯
    
    2.2.uboot命令的软件实现过程
    明确：uboot所有的命令源码都是在uboot根目录的common目录中
    cd /opt/uboot
    ls common/ 存放uboot命令源码
    源码命令：cmd_xxx.c
    以Nand命令为例,了解命令的实现过程
    vim common/cmd_nand.c
    //定义nand命令
    U_BOOT_CMD(
	nand,	5,	1,	do_nand,
	"nand    - legacy NAND sub-system\n",
	"info  - show available NAND devices\n"
	"nand device [dev] - show or set current device\n"
	"nand read[.jffs2[s]]  addr off size\n"
	"nand write[.jffs2] addr off size - read/write `size' bytes starting\n"
	"    at offset `off' to/from memory address `addr'\n"
	"nand erase [clean] [off size] - erase `size' bytes from\n"
	"    offset `off' (entire device if not specified)\n"
	"nand bad - show bad blocks\n"
	"nand read.oob addr off size - read out-of-band data\n"
	"nand write.oob addr off size - read out-of-band data\n"
    );   	
    第一个参数表示命令名nand
    第二个参数表示命令参数的个数   
    第三个参数表示命令是否需要重复执行：1表示重复,0表示不重复
    第四个参数表示命令对应的执行函数do_nand
    第五个参数表示命令的简要说明
    第六个参数表示命令的详细说明
    
    int do_nand(cmd_tbl_t * cmdtp, int flag, 
    		   int argc, char *argv[])     
    {
    	//前两个参数无需关注
    	  只需关注argc=命令参数的个数
    	          argv=命令参数的信息
    	//nand erase 500000 100000
    	  argc = 4
    	  argv[0] = "nand"
	  argv[1] = "erase"
	  argv[2] = "500000"
	  argv[3] = "100000"
	  
	//根据argc和argv进行操作硬件
    }	
    
   添加自己命令的思路：
   cd /opt/uboot
   vim common/cmd_xxx.c 添加如下内容：
   
   do_xxx(...)
   {
   	printf("hello,uboot\n");
   	return 0;
   }	  
   
   U_BOOT_CMD(
	xxx,	1,	0,	do_xxx,
	"hello\n",
	"uboot"
    ); 
  
  保存退出
  
  vim common/Makefile //添加cmd_xxx.c的编译支持
  随意添加：COBJS-y += cmd_xxx.o
  保存退出
  
  make
  cp u-boot.bin /tftpboot
  更新uboot
  执行xxx命令
  
  案例：给uboot添加LED开关灯命令
  参考代码：ftp://PORTING/led_logo.rar/u-boot-led
  说明：
  cmd_led.c //命令的实现文件,调用开关灯函数
  led.c //开关函数的定义
  led.h //开关灯函数的声明
  Makeifle //common目录下的Makefile,不要搭理！
  实施步骤：
  虚拟机执行：
  先阅读源码,看懂
  cp cmd_led.c /opt/uboot/common
  cp led.c /opt/uboot/common
  cp led.h /opt/uboot/common
  cd /opt/uboot
  vim common/Makefile 添加
  COBJS-y += cmd_led.o
  COBJS-y += led.o
  保存退出
  make 
  cp u-boot.bin /tftpboot
  
  TPAD上执行：
  tftp 20008000 u-boot.bin
  nand erase 0 200000
  nand write 20008000 0 200000
  reset
  led on 
  led off
  
3.uboot添加logo显示功能
  3.1.明确：是否所有的uboot都需要添加logo显示呢？
      答：不一定
      明确：哪些设备需要logo显示呢？
      答：只要有LCD显示屏,必须添加
  
  3.2.logo显示的功能
      提高用户的体验度
      善意的"欺骗"
      
  3.3.logo显示的原则
      明确：嵌入式linux系统启动过程需要三步骤
            uboot->zImage->rootfs
      显示的时间越早越好！
      logo本质就是一帧图像(一张图片),这个图片一定要小(尺寸要小,图像色彩元素要少)
      一般来说：背景是黑色,logo图片是白色！
      
  3.4.LCD显示原理
      涉及四个硬件：
      显存：共享内存
      DRAM控制器：操作内存
      LCD控制器：又称集成显卡,操作LCD显示屏
      LCD显示屏：仅仅做显示
      DRAM控制器从显存读取数据丢给LCD控制器，LCD控制器
      将数据丢给LCD显示屏显示
      结论：与其说是操作LCD显示屏,不如说是操作显存
      
  3.5.图像(图片)显示属性 
      图像本质就是一个一个的像素点组合在一起
      每一个像素点都有对应的一种颜色(淡紫色)
      任何一种颜色都有三元色（RGB）组合而成
      只要将RGB按照一定的比例进行"勾兑"最终形成一种颜色
      以24位真彩色(一种颜色计算机用24bit来表示)为例
      RGB每一个颜色分量占8bit
      纯红：0x00ff0000
      纯绿：0x0000ff00
      纯蓝：0x000000ff
      纯白：0xffffffff
      纯黑：0x00000000
      
  3.6.在TPAD中的uboot添加logo
      1.画点
      2.画线
      3.画矩形
      4.画圆
           
          	















  
           
  
  
   
```