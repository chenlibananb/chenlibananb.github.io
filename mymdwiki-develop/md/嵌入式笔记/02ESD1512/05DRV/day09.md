```
回顾：
1.linux内核内存使用相关内容
  1.1.4G虚拟内存的划分
        空间        虚拟内存大小     地址范围				划分
      用户空间        3G              0~0xBFFFFFFF     		TEXT/DATA/BSS/堆/MMPA/栈
      			
      内核空间        1G              0xC0000000~0xFFFFFFFF	直接/动态/永久/固定/DMA/...
  1.2.linux内核内存分配的方法
      kmalloc/kfree
      __get_free_pages/free_pages
      	GFP_KERNEL:
      	GFP_ATOMIC:
      	
      vmalloc/vfree
      bootargs:vmalloc
      bootarg:mem + ioremap
      
2.linux内核地址映射的方法
  切记：无论在内核空间还是用户空间,都不允许直接访问设备的
        物理地址,必须将物理地址映射到内核空间的虚拟地址
        或者用户空间的虚拟地址上,将来访问映射的虚拟地址
        就是在访问对应的物理地址  
  问：如何将硬件外设的物理地址映射到内核空间的虚拟地址上呢？
  答：采用大名鼎鼎的ioremap函数
  
3.问：如何将硬件外设的物理地址映射到用户空间的虚拟地址上呢？
  答：采用mmap机制
  3.1.切记：硬件外设的物理地址可以同时映射到内核的虚拟地址上
        还可以映射到用户的虚拟地址上
  
  3.2.回顾UC的mmap系统调用函数
  int fd = open("a.txt", O_RDWR);
  
  void *addr;
  addr = mmap(0,0x1000, PROT_READ|PROT_WRITE,
  		MAP_SHARED, fd, 0);
  功能：将文件a.txt映射到当前进程3G虚拟内存的MMAP虚拟内存映射区
        将来访问映射的虚拟内存映射区,就是在访问文件本身！
        注意：文件a.txt是虚拟的概念,真实对应的是存储器某块
              存储空间(例如Nand),这块存储空间也有对应的物理地址
              和大小,与其说是用mmap将文件映射到MMAP虚拟内存区域
              不如说是把存储器对应的存储空间(也有物理地址和大小)映射到MMAP
              虚拟内存区域,一旦映射好以后,访问用户空间的MMAP虚拟内存区域的
              虚拟内存就是在访问对应的物理地址
  参数：
  0:注意噢,MMAP虚拟内存映射区还是比较大滴！如果指定为0
    表示告诉内核,请内核帮你在MMAP虚拟内存映射区中找一块
    空闲的虚拟内存用来映射外设的物理地址(内存)           
  0x1000：空闲虚拟内存区域的大小
  PROT_READ|PROT_WRITE,MAP_SHARED:将来这块空闲虚拟内存区域的访问权限
  fd:对应的文件,本质对应的存储外设(Nand)
  0:文件的偏移量
  
  返回值：addr就是映射的用户虚拟内存区域的首地址
  将来访问addr就是在访问文件本身,就是在访问外设
  
  //向用户虚拟内存区域写入数据,等价于向文件写入数据
  memcpy(addr, "hello,world", 12);      
  
  总结:利用mmap能够将外设的物理地址映射到用户虚拟地址上
  
  3.3.mmap系统调用函数内部的实现过程
  1.应用程序调用mmap系统调用函数
  2.首先调用到C库的mmap函数定义
  3.C库的mmap函数中将做两件事：
    1.保存mmap系统调用函数的系统调用号到R7寄存器
    2.调用svc触发软中断异常
  4.CPU跳转到内核事先准备好的软中断处理入口,进入以后做两件事：
    1.从R7取出之前保存的系统调用号
    2.以系统调用号为索引在内核的系统调用表中找到对应的内核
      函数sys_mmap，调用此函数：
  5.内核的sys_mmap将做3件事：
    1.内核会在当前进程的3G的MMAP虚拟内存区域找到一块空闲的
      虚拟内存,这块虚拟内存将来用于映射外设的物理地址(内存)
    2.一旦找到空闲的虚拟内存区域,内核就会用struct vm_area_struct
    数据结构来定义一个对象,来描述这块空闲的虚拟内存区域的属性(起始地址，
    读写权限,偏移量等)
    struct vm_area_struct {
    	unsigned long vm_start; //空闲虚拟内存的首地址
    			        //mmap函数的返回值addr就是vm_start
    	unsigned long vm_end;//结束地址		        
    	pgprot_t vm_page_prot;//访问权限
    	unsigned long vm_pgoff;	//偏移量
    	...
    };
    3.最后调用底层驱动的mmap接口,并且将内核创建的描述虚拟
    内存区域的对象的首地址传递给驱动的mmap接口
    
  6.底层驱动的mmap接口"永远只做一件事"：就是将已知的
    用户虚拟地址(驱动形参指针获取)跟已知的物理地址进行映射即可
    驱动的mmap接口相当于"红娘",只负责建立两者之前的关系,但是不负责
    如何具体的访问操作(不负责小两口如何过日子)
      
  7.总结：一旦利用mmap将物理地址映射到用户虚拟地址上,将来对硬件的
  任何访问操作都应该在应用程序去实现(对寄存器的操作)

  3.4.底层驱动的mmap接口
  struct file_operations {
  	int (*mmap)(struct file *file,
  			struct vm_area_struct *vma)
  };
  功能：
  永远只做一件事：将已知的用户虚拟地址和物理地址做映射
                  但不对硬件进行访问操作
  file:文件指针
  vma:切记指向内核创建的描述空闲虚拟内存区域的对象
      将来驱动可以通过此指针来获取空闲虚拟内存区域的
      各个属性！
  问：驱动mmap如何将已知的物理地址和用户虚拟地址做最终的
      映射呢？（万事具备只欠东风）
  答：驱动mmap只需调用一下函数即可完成最终的映射
  int remap_pfn_range(struct vm_area_struct *vma, 
  		    unsigned long from,
		    unsigned long pfn, 
		    unsigned long size, 
		    pgprot_t prot)
  函数功能：最终将物理地址映射到用户虚拟地址上
  参数：
  vma:指向内核创建的描述空闲虚拟内存区域的对象
      将来驱动可以通过此指针来获取空闲虚拟内存区域的
      各个属性！
  from：映射的用户起始的虚拟地址,就是vm_start	 
  pfn:物理地址>>12，例如：0xE0200060>>12 
  size:映射内存的大小,vm_end - vm_start 
  prot:映射时内存的访问权限, vm_page_prot 
  
  总结：vm_start对应的物理地址就是pfn
        vm_start并且等于mmap的返回值addr
        将来用户访问addr就是在访问外设的物理地址
  
  切记切记：映射的用户起始虚拟地址vm_start和物理地址必须
            保证是页面大小的整数倍！地址除以4K必须要整除
  物理地址                          用户虚拟地址
  0xE0200060     不能做映射         不行
  0xE0200064     不能做映射         不行
  0xE0200000     可以		    addr
  0xE0200060                        addr + 0x60
  0xE0200064                        addr + 0x64
  
  案例：利用mmap实现开关灯
  切记：对于GPIO操作,即输入和输出操作,如果采用mmap,必须
  将虚拟内存访问属性的cache功能禁止掉！
  vma->vm_page_prot = pgprot_noncached(vma->vm_page_prot);
*********************************************************
3.linux内核platform机制  
  3.1.分析ioremap实现的LED驱动
  场景：将LED1和LED2对应的GPIO由GPC0_3,GPC0_4更换成GPF1_4,GPF1_5
  分析驱动需要做哪些修改！
  总结：
  1.一个硬件设备驱动由两部分组成：
    纯硬件信息：
    		0xE0200060:基地址
    		12/16：bit位
    		3/4：GPIO硬件编号
    纯软件信息：
    		注册个混杂设备
    		if...else
    		swtich...case
    		|/&
  2.目前的驱动只要硬件发生变化,驱动几乎从头到尾都要进行
    修改,但是发现修改的内容仅仅是纯硬件信息,软件信息无需改动
    但是目前的驱动可移植性非常差！
    
  传统方法进行改进：
  采用C语言的#define进行改进：
  #define GPIO_BASE	(0xE0200060)
  #define GPC0_3	(3)
  #define GPC0_4	(4)
  将来如果硬件发生变化,驱动无需改动,只需小改以上三个宏即可
  让代码的可移植性变得非常好,但是不能给这些硬件附加其他的
  一些属性
  
  3.2.内核改进的方法：linux内核将纯硬件信息和纯软件信息彻底分离
  一旦驱动软件写好,驱动开发者将来的重心放在纯硬件信息上,只要
  硬件发生变化,只需修改硬件信息即可,软件无需改动,这就是内核的
  分离思想
  
  问：linux内核的分离思想如何具体实施呢？
      就是驱动.c写好,硬件怎么变,源程序无需改动,
      只需改动硬件信息即可！
      
  答：采用platform机制实现这种分离思想
  具体参见4页PPT
  并且会画图
  
  总结：将来驱动如果采用platform机制,驱动开发者只需围绕着
  两个数据结构展开工作即可：
  struct platform_device
  struct platform_driver
  什么总线,什么遍历,什么匹配,什么调用probe函数,什么传递硬件信息
  都是由内核来完成,驱动开发者只需用以上两个结构体定义硬件和软件
  对象和初始化对象,最终向内核注册即可！
  
  3.3.问：这两个数据结构怎么玩？
      答：struct platform_device
  数据结构原型：
  struct platform_device {
  	const char	* name;
	int		id;
	u32		num_resources;
	struct resource	* resource;
	...
  };
  作用：描述和装载纯硬件信息
  成员：
  name:硬件节点的名称,相当重要,将来用于匹配
  id:硬件节点的编号,如果有多个同名的硬件节点,通过id进行区分
     如果只有一个硬件节点,id=-1,如果有多个,id=0,1,2,...
  resource:指向纯硬件信息
  	  对应的数据结构struct resource
  	  struct resource {
  	  	unsigned long start;
		unsigned long end;
		unsigned long flags;
		....
  	  }
  	  作用：用来描述纯硬件信息
  	  start:硬件的起始信息
  	  end:硬件的结束信息
  	  flags:硬件的标志,常用的两个宏：
  	        IORESOURCE_MEM:地址类的信息
  	        IORESOURCE_IRQ:IO类或者中断号类的信息
  	  例如：
  	  struct resource led_res[] = {
  	  	//描述寄存器地址信息
  	  	{
  	  		.start = 0xE0200060,
  	  		.end = 0xE0200060 + 8,
  	  		.flags= IORESOURCE_MEM
  	  		
  	  	},
  	  	//描述GPIO编号GPC0_3信息
  	  	{
  	  		.start = 3,
  	  		.end = 3,
  	  		.flags = IORESOURCE_IRQ
  	  	},
  	  	//描述GPIO编号GPC0_4信息
  	  	{
  	  		.start = 4,
  	  		.end = 4,
  	  		.flags = IORESOURCE_IRQ
  	  	}
  	  };      
  	  
  	  总结：只要让resource指针指向led_res即可,代表
  	  platform_device装载了硬件信息	
  
  num_resources:硬件资源的个数,等于ARRAY_SIZE(led_res)
  
  配套函数：
  //注册硬件节点对象到dev链表
  int platform_device_register(&硬件节点对象);
  //从dev链表卸载硬件节点对象
  int platform_device_unregister(&硬件节点对象);

案例:利用platform机制重新改造LED驱动程序


3.4.问：struct platform_driver如何玩呢？
    答：
    数据结构原型：
    struct platform_driver {
    	struct device_driver driver;
    	int (*probe)(struct platform_device *pdev);
    	int (*remove)(struct platform_device *pdev);
    	...
    };  
   作用：描述纯软件信息
   driver:只需关注其中的name字段,将来用于匹配
   probe:硬件和软件匹配成功,内核调用此函数,并且pdev指针
   	 指向匹配成功的硬件节点
   remove：卸载软件或者硬件节点,内核调用此函数,并且pdev指针
   	 指向匹配成功的硬件节点
   注意：probe和remove永远是死对头！类似入口函数和出口函数
   注意：probe函数的是否被调用,至关重要,如果调用,说明一个完整的
   硬件驱动诞生,如果没有被调用,驱动不完整！

   配套函数：
  //注册软件节点对象到drv链表
  int platform_driver_register(&软件节点对象);
  //从drv链表卸载软件节点对象
  int platform_driver_unregister(&软件节点对象);
  
  总结：
  一般来说probe函数做三件事：
  1.通过形参pdev指针获取硬件信息
  2.对硬件信息进行处理
    该申请资源的申请资源
    该地址映射的地址映射
    该注册中断的注册中断
    该初始化的初始化(配置为输出口等)
  3.注册硬件的操作接口(注册字符设备驱动或者混杂设备驱动)
  
  remove函数跟probe对着干：
  
案例:利用platform机制重新改造LED驱动程序 
ARM测试：
1.insmod led_dev.ko
2.insmod led_drv.ko
3.rmmod led_drv
4.rmmod led_dev
5.insmod led_drv.ko
6.insmod led_dev.ko
7.rmmod led_dev
8.rmmod led_drv
  
案例：将probe函数和remove填充完毕,实现最终的开关灯
      给用户提供的接口为ioctl
         
```