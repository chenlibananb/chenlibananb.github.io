```
回顾：
1.linux内核GPIO操作库函数
  gpio_request/gpio_free
  gpio_direction_output/gpio_direction_input
  gpio_set_value/gpio_get_value

2.linux内核系统调用

3.linux内核字符设备驱动相关内容
  3.1.设备驱动职能
  3.2.驱动分类
  3.3.字符设备驱动
      1.linux理念
      2.字符设备文件
        /dev/
        c
        major
        minor
        设备文件名
        配合系统调用
      3.设备号
        包含
        dev_t
        12
        20
        MKDEV
        MAJOR
        MINOR
        资源
        alloc_chrdev_region/unregister_chrdev_region
        major:应用根据major找驱动
        minor:驱动根据minor区分硬件个体
        
      4.linux内核描述字符设备驱动数据结构
        struct cdev {
        	dev
        	count
        	ops
        };
        配套函数：
        cdev_init
        cdev_add
        cdev_del
        
        //硬件操作接口数据结构
        struct file_operations {
        	.open //打开
        	.release //关闭
        };
        调用关系
        应用open->C库open->软中断->内核sys_open->.open
        应用close->C库close->软中断->内核sys_close->.release
     
     5.字符设备驱动编码过程
     1.写头文件
     2.写入口和出口函数
       修饰
     3.声明描述硬件信息的数据结构
     4.定义初始化硬件对象
     5.定义初始化软件相关的对象
       硬件操作对象
       字符设备对象
       设备号对象
     6.填充入口函数和出口函数
       先写注释
       最后填充代码
     7.编写最后的各个接口函数
     
**********************************************************
4.linux内核字符设备驱动硬件操作接口之write
  明确：对于linux系统,对于32位系统,整个虚拟地址空间4G
        用户空间每一个进程独占4G中的前3G虚拟地址空间；
        内核空间占4G的后1G虚拟地址空间,所有进程都共享！
        
  4.1.回顾write系统调用函数
  char buffer[1024] = {0}; //分配用户缓冲区
  memcpy(buffer,"hello,world", 12);
  
  ret = write(fd, buffer, 1024); //向设备写入数据  
  
  4.2.底层驱动对应的write接口
  struct file_operations {
    ssize_t (*write)(struct file *file, 
    			const char __user *buf,
    			size_t count,
    			loff_t *ppos)
  };
  此接口功能：向硬件设备写入数据
              数据来自用户
  调用关系：
  应用write->C库write->软中断->内核sys_write->驱动.write = led_write
  参数：
  file：文件指针
  buf：此指针变量用__user修饰,表明此指针变量保存的地址一定
      位于用户空间,保存用户缓冲区的首地址(buffer),切记
      在内核驱动中不允许直接操作访问此指针变量来获取数据信息
      (例如：内核程序：char c = *buf),因为如果应用程序的write函数的
      第二个参数给NULL,直接操作系统崩溃,相当危险！
      必须利用内核提供的内存拷贝函数copy_from_user,将用户缓冲区的数据
      拷贝到内核缓冲区(后1G虚拟内存空间)中
  count:想要写入的字节数
  ppos:保存上一次的写位置,编程操作步骤：
       1.先获取上一次的写位置
         loff_t pos = *ppos;
       2.如果这次写了100字节,写完以后更新写位置
         *ppos = pos + 100;
       3.此参数一般用在多次写的场合(一次写不完)
         如果一次性写完了,可以不用搭理此参数
  
  unsigned long copy_from_user(void *to, 
  			const void __user *from, 
  			unsigned long n)
  功能：将用户缓冲区的数据拷贝到内核缓冲区
        切记：此函数仅仅实现用户和内核两个缓冲区数据的
        拷贝,但不涉及硬件的操作,只是将数据从3G虚拟内存拷贝
        到后1G虚拟内存中！
  参数：
  to:内核缓冲区首地址
  from:用户缓冲区首地址
  n：要拷贝的字节数
  
  总结：在内核编程时,只要看到指针变量用__user修饰,这个变量
        一定保存用户缓冲区的首地址
  底层驱动write接口操作三步曲：
  1.定义内核缓冲区
  2.利用内存拷贝函数将用户缓冲区数据拷贝到内核缓冲区
  3.将内核缓冲区的数据最后写入硬件(写入硬件对应的寄存器)
  4.数据流走向：
    用户空间->内核空间->硬件,经过两次数据操作  
    
案例：用户要求，写1开灯；写0关灯
注意：用户并没有对底层驱动的open,release有所有要求
      底层驱动可以不用初始化添加open,release接口函数
      导致应用程序的open,close调用永远成功！
实施步骤：
1.mkdir /opt/drivers/day03/1.0 -p
2.cd /opt/drivers/day03/1.0
3.vim led_drv.c 
4.vim led_test.c
5.vim Makefile
6.make
7.arm-linux-gcc -o led_test led_test.c
8.cp led_drv.ko led_test /opt/rootfs

ARM执行：
1.insmod led_drv.ko
2.cat /proc/devices //查看申请的主设备号
3.mknod /dev/myled c 250 0 
4../led_test on
  ./led_test off

***********************************************************
5.linux内核字符设备驱动硬件操作接口之read
  明确：对于linux系统,对于32位系统,整个虚拟地址空间4G
        用户空间每一个进程独占4G中的前3G虚拟地址空间；
        内核空间占4G的后1G虚拟地址空间,所有进程都共享！
        
  4.1.回顾read系统调用函数
  char buffer[1024] = {0}; //分配用户缓冲区 
  ret = read(fd, buffer, 1024); //从设备读取数据,放到buffer缓冲区中  
  
  4.2.底层驱动对应的read接口
  struct file_operations {
    ssize_t (*read)(struct file *file, 
    			char __user *buf,
    			size_t count,
    			loff_t *ppos)
  };
  此接口功能：从硬件设备读取数据,并且将读取的数据丢给用户
              数据来自硬件
  调用关系：
  应用read->C库read->软中断->内核sys_read->驱动.read = led_read
  参数：
  file：文件指针
  buf：此指针变量用__user修饰,表明此指针变量保存的地址一定
      位于用户空间,保存用户缓冲区的首地址(buffer),切记
      在内核驱动中不允许直接操作访问此指针变量来将数据丢给用户
      (例如：内核程序：*buf='A'),因为如果应用程序的read函数的
      第二个参数给NULL,直接操作系统崩溃,相当危险！
      必须利用内核提供的内存拷贝函数copy_to_user,将内核缓冲区的数据
      拷贝到用户缓冲区中
  count:想要读取的字节数
  ppos:保存上一次的读位置,编程操作步骤：
       1.先获取上一次的读位置
         loff_t pos = *ppos;
       2.如果这次读了100字节,读完以后更新读位置
         *ppos = pos + 100;
       3.此参数一般用在多次读的场合(一次读不完)
         如果一次性读完了,可以不用搭理此参数
  
  unsigned long copy_to_user(void __user *to, 
  			const void  *from, 
  			unsigned long n)
  功能：将内核缓冲区的数据拷贝到用户缓冲区
        切记：此函数仅仅实现用户和内核两个缓冲区数据的
        拷贝,但不涉及硬件的操作,只是将数据从1G虚拟内存拷贝
        到后3G虚拟内存中！
  参数：
  to:用户缓冲区首地址
  from:内核缓冲区首地址
  n：要拷贝的字节数
  
  总结：在内核编程时,只要看到指针变量用__user修饰,这个变量
        一定保存用户缓冲区的首地址
  底层驱动read接口操作三步曲：
  1.定义内核缓冲区
  2.从硬件读取数据到内核缓冲区
  3.利用内存拷贝函数将内核缓冲区拷贝到用户缓冲区
  4.数据流走向：
    硬件->内核空间->用户空间,经过两次数据操作     
    
案例：获取灯的开关状态

作业：用户需求：利用write能够指定某个灯的开和关 
********************************************************
6.linux内核字符设备驱动硬件操作接口之ioctl
  6.1.学习掌握ioctl系统调用函数
  ioctl函数原型：
  int ioctl(int fd, int request, ...); 
  函数功能：
  1.应用利用ioctl能够向设备发送控制命令
  2.应用利用ioctl能够跟设备进行读/写操作
  
  参数：
  fd:设备文件描述符
  request：应用程序向设备发送的控制命令
  	   命令由程序员自行定义：
  	   #define LED_ON	0x100001
  	   #define LED_OFF	0x100002
  	   友情提示：10以内勿用
  ...：如果ioctl要传递三个参数,那么第三个参数传递的就是
       用户缓冲区的首地址,将来底层驱动通过第三个参数可以
       向用户缓冲区读或者写数据
 返回值：执行成功返回0，执行失败返回-1
 应用程序例子：
 //开灯
 ioctl(fd, LED_ON); //传递两个参数,仅仅发命令
 //关灯
 ioctl(fd, LED_OFF);
 //开第一个灯
 int uindex = 1;
 ioctl(fd, LED_ON, &uindex);//传递三个参数,不仅仅发命令,写入灯的编号
 //关第二个灯
 int uindex = 2;
 ioctl(fd, LED_OFF, &uindex);
 
 //获取第一个灯的状态
 int ustatus;
 ioctl(fd, LED_GET_STATUS, &ustatus);
 printf("status保存灯的状态 %d\n", status);
 
 6.2.底层驱动对应的ioctl接口
 struct file_operations {
    long (*unlocked_ioctl)(struct file *file,
    			   unsigned int cmd,
    			   unsigned long arg)
 };
 接口功能：
 1.应用利用ioctl能够向设备发送控制命令
 2.应用利用ioctl能够跟设备进行读/写操作
 调用关系：应用ioctl->C库ioctl->软中断->内核的sys_ioctl->驱动的ioctl
 参数：
 file:文件指针
 cmd:保存用户发送过来的命令,驱动需要对cmd进行解析判断
     switch(cmd) {
     	case ....
     	     break;
     	case ...
     	     break;
     	....
     }
 arg:如果应用程序的ioctl传递三个参数,arg保存应用程序ioctl
     的第三个参数,也就是arg保存用户缓冲区的首地址,所以同样
     在内核驱动中不能直接对arg访问(int kindex = *(int *)arg)
     必须要利用内核提供的内存拷贝函数完成用户缓冲区和
     内核缓冲区的数据拷贝！
     当然如果应用ioctl仅仅发送命令,arg无需搭理！

总结：底层驱动ioctl接口编程框架：
情形1.如果应用传递两个参数
  底层驱动ioctl：
  1.直接解析命令
  2.根据命令操作硬件

情形2.如果应用传递三个参数
  底层驱动ioctl
  1.定义内核缓冲区
  2.解析命令,根据不同的命令执行不同的事务(读或者写)
  3.如果是读,驱动需要从硬件获取数据拷贝到内核缓冲区
    再从内核缓冲区拷贝数据到用户缓冲区
    如果是写,驱动从用户缓冲区读取数据到内核
    内核再将数据写入硬件
    注意：步骤2,3的顺序可以颠倒！
    
案例：利用ioctl实现开关某个灯 
步骤同上！
*********************************************************
6.linux内核字符设备驱动之设备文件的自动创建
  6.1.字符设备文件创建两种方法
  1.手动创建
    cat /proc/devices //获取申请的主设备号
    驱动操作一个硬件设备个体,次设备号给0
    mknod /dev/设备文件名 c 主设备号  次设备号

  2.设备文件的自动创建
  必须按照以下几个步骤：
  1.保证根文件系统中必须有mdev可执行程序
    mdev可执行程序将来用于帮你创建设备文件
    which is mdev
    此软件由内核来帮你调用启动！
  
  2.保证根文件系统的启动文件rcS脚本中必须有一下几句话：
    vim /opt/rootfs/etc/init.d/rcS
    mount -a #将来用于解析fstab文件,进行一系列的挂接动作
    echo /sbin/mdev > /proc/sys/kernel/hotplug //告诉内核
    将来创建设备文件的人是/sbin/mdev
    hotplug文件由内核自动创建,前提是/proc目录必须作为procfs
    虚拟文件系统的挂接点(入口)
    
  3.保证根文件系统的启动文件fstab中必须有一下几句话
  proc           /proc        proc   defaults
  sysfs          /sys         sysfs  defaults
  将procfs虚拟文件系统挂接到/proc目录
  将sysfs虚拟文件系统挂接到/sys目录

  4.设备驱动只需调用一下四个函数即可完成设备文件的最终创建
    struct class *cls; //定义设备类(树枝)指针
    //定义初始化设备类,设备类名称为tarena(树枝叫tarena)
    //内核会自动在/sys/class目录下创建一个tarena目录
    //将来tarena目录存放创建设备文件的原材料(主次设备号和设备文件名)
    cls = class_create(THIS_MODULE, "tarena");
    //自动创建设备文件myled(长苹果)
    //本质此函数最终调用hotplug文件中/sbin/mdev来创建设备文件
    device_create(cls, NULL, dev, NULL, "myled");
    
    //自动删除设备文件(摘苹果)
    device_destroy(cls, dev);
    
    //自动删除设备类(砍树枝)
    class_destroy(cls);
  
案例：在上一个案例的代码中添加设备文件自动创建功能
案例：将三个保证中的任何一个失效,验证是否还能创建设备文件

***********************************************************
7.linux内核字符设备驱动之inode和file结构体
  struct inode {
  	dev_t	i_rdev;	//保存驱动申请的设备号信息
  	struct cdev *i_cdev;//指向驱动定义初始化的字符设备对象led_cdev
  	...
  };   
  作用：用来描述一个文件的物理信息(大小,创建日期,修改日期,用户和组,权限等)
  生命周期：只要文件创建(mknod),内核就会创建一个inode对象来描述
            此文件的物理上的信息
            只要文件删除(rm),内核也会自动删除对应的inode
            对象
            所以：struct file_operations哪些接口函数的形参
            inode指针本质就指向内核创建的inode对象
    
  struct file {
  	struct file_operations	*f_op;//指向驱动定义初始化的硬件操作对象led_fops
  	...
  };
  作用：描述一个文件被打开(open)以后的状态属性
        open("a.txt", O_RDWR) //权限问题
  声明周期：当一个文件被成功打开以后,内核会创建一个file
  	   对象来描述此文件被打开以后指定的特性
  	   当文件被关闭(close),内核也会销毁对应的file对象
  	   所以：struct file_operations哪些接口函数的形参
           file指针本质就指向内核创建的file对象 
    
  结论：一个文件仅有一个唯一的inode对象
        但是可以有多个file对象
  切记：inode和file之间的关系：
  //通过file找对应的inode对象指针
  struct inode *inode = file->f_path.dentry->d_inode;
  在内核源码只需看LCD显示驱动fbmem.c
  
  注意：一般应用在驱动通过次设备号区分硬件个体的场合：
  struct inode *inode = file->f_path.dentry->d_inode;
  int minor = MINOR(inode->i_rdev);

案例：如何通过次设备号来分区硬件个体呢
分析：
硬件     设备文件     主设备号     次设备号     驱动(cdev,file_operations)
LED1     myled1         共享	     0		共享
LED2     myled2		共享	     1		共享








		作业：利用write实现开关某个灯
      		      代码狂欢到：6：00	





   
 
  
      
      
      
      
      
      
      
         
```