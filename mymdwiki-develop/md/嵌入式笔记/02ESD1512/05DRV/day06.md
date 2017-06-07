```
回顾：
1.中断顶半部和底半部机制
  本质：中断处理函数长时间占有CPU资源的场合
  顶半部：本质就是中断处理函数
  底半部：本质就是延后执行
  tasklet
  工作队列
  软中断

2.linux内核定时器
  硬件定时器
  HZ
  jiffies
  t = jiffies;
  ...
  time_after(jiffies, t+20*HZ)
  time_before
  软件定时器
  struct timer_list
  基于软中断实现,超时处理函数不能进行休眠操作
  内核延时方法
  schedule_timeout(5);
  
*************************************************************
3.案例：用户需求:要求LED设备只能被一个应用程序打开访问操作
  分析过程：
  方案1：在应用层实现这个需求
         可以利用进程间通信的机制让各个进程互相询问
         (B->A;C->A/B)
         结论：这个方案不是不行,而是软件设计过于繁琐
  方案2：在内核层实现这个需求
         明确：不管有多少个进程访问设备,永远先open,最终它们
         都会调用底层驱动的同一个open接口函数(led_open),
         只要在此函数中做相关的代码限定即可(一夫当关万夫莫开)
  
  方案2对应的底层驱动led_open函数参考代码：
  static int open_cnt = 1; //全局变量
  static int led_open(struct inode *inode, struct file *file)
  {
  	if (--open_cnt != 0) {
  		printk("设备已被打开!\n");
  		open_cnt++;
  		return -EBUSY;
  	}
  	printk("设备打开成功!\n");
  	return 0;
  }
  static int led_close(struct inode *inode, struct file *file)
  {
	open_cnt++;
  	return 0;
  }
  
  仅仅研究--open_cnt这个表达式代码
  正常情况：
  A进程先运行：
  	读取(ldr)：open_cnt=1
  	修改,写回(str): open_cnt=0
  	结果：打开设备成功
  B进程接着执行：
  	读取(ldr)：open_cnt=0
  	修改,写回: open_cnt=-1
  	结果：打开设备失败
  	
  异常情况：
  A进程先运行：
  	读取(ldr)：open_cnt=1
  就在此时此刻,由于linux内核支持进程之间的抢占,B进程的优先级
  高于A进程,B进程从A进程抢夺走CPU资源,B进程开始运行,当然
  B进程会保护A进程的现场(进程的抢占机制基于软中断实现)
  
  B进程接着执行：
  	读取(ldr)：open_cnt=1
  	修改,写回(str): open_cnt=0
  	结果：打开设备成功
  B进程执行完毕,将CPU资源再给A进程(恢复现场)
  
  A进程接着继续执行：
  	修改,写回: open_cnt=0
  	结果：打开设备成功
  
  问：如何解决这种异常呢？
  答：引出linux内核并发和竞态知识点

2.linux内核并发和竞态相关概念
  2.1.概念
  并发：多个执行单元(任务)同时发生
        任务：中断或者进程
  竞态: 多个执行单元对共享资源进行同时的访问形成竞争的状态
  共享资源：软件上的全局变量或者硬件资源(寄存器)
            例如open_cnt/GPC0CON
  形成竞态的条件：
  	1.要有共享资源
  	2.执行单元至少两个
  	3.还要同时访问
  临界区：访问共享资源的代码区域
         if (--open_cnt != 0) {
  		printk("设备已被打开!\n");
  		open_cnt++;
  		return -EBUSY;
  	 }  	 
  互斥访问：当一个执行单元在访问临界区时,其他执行单元被
            禁止访问,直到前一个执行单元访问完毕！
            
  执行路径具有原子性：当一个执行单元在访问临界区时,不允许
  		      发生CPU资源的切换(牢记)！
   
  2.2.linux内核形成竞态的情形
  1.多CPU(多核,SMP)
    多CPU共享主存,外存,IO,也会形成竞态
  2.单CPU进程与进程之间的抢占(进程必须在同一个CPU上运行)
    如果A,B两个进程运行在同一个CPU上,并且A,B有优先级区分
    势必形成竞态；
    如果A,B两个进程各自运行在CPU1和CPU2上,不会形成竞态,但是
    如果同时访问某个外设,也会形成竞态,这个竞态应该属于第一种！
  3.中断(硬件和软件)和进程 
  4.中断和中断
    软中断和软中断
    tasklet_shedule(...)/tasklet_hi_schedule() 
    硬件中断和软中断
 
  2.3.linux内核解决竞态引起的问题的方法
  明确：计算机由了中断,有了进程的抢占,让计算机的世界变得
        丰富多彩,让计算机的处理数据的实时性更加优越
        ,如果出现异常,想办法解决规避即可！
  linux内核提供解决竞态引起问题的方法：
  1.中断屏蔽
  2.自旋锁
  3.信号量
  4.原子操作
  
3.解决竞态问题的方法之中断屏蔽
  特点：
  能够解决中断和中断引起的竞态问题
  能够解决中断和进程引起的竞态问题
  能够解决进程之前的抢占引起的竞态问题
  使用：
  当一个执行单元在访问临界区时,如果考虑到有中断引起竞态,
  此时执行单元在访问临界区之前屏蔽中断,这样中断不会打扰
  此执行单元,也不会发生CPU资源的切换,注意：临界区访问完毕
  记得要重新打开中断,因为操作系统的很多机制都是要靠中断来完成
  切记：
  中断屏蔽保护的临界区千万不能进行休眠操作,并且中断屏蔽保护的
  临界区的代码执行速度要快！否则造成操作系统的崩溃！
  
  编程使用步骤：
  1.明确驱动代码中哪些是共享资源
  2.明确驱动代码中哪些是临界区
  3.明确临界区中是否有休眠操作：
    如果有,势必不考虑使用中断频率
    如果没有,"可以考虑"使用中断频率
  4.访问临界区之前屏蔽中断
    unsigned long flags;
    local_irq_save(flags); //屏蔽中断,并且让内核帮你保存中断的状态信息
  5.踏踏实实访问临界区
    //访问期间会有进程抢占？
    //访问期间会有硬件中断?
    //访问期间会有软中断?
    答：都不会
    
  6.访问临界区之后恢复中断
    local_irq_restore(flags);  //恢复中断       
  7.屏蔽中断和恢复中断必须在逻辑上成对
      		      
  参考代码：
  static int open_cnt = 1; //全局变量,(共享资源)
  static int led_open(struct inode *inode, struct file *file)
  {
  	unsigned long flags;
  	
  	//屏蔽中断
  	local_irq_save(flags);
  	//临界区
  	if (--open_cnt != 0) {
  		printk("设备已被打开!\n");
  		open_cnt++;
  		//恢复中断
  		local_irq_restore(flags);
  		return -EBUSY;
  	}
  	//恢复中断
  	local_irq_restore(flags);
  	printk("设备打开成功!\n");
  	return 0;
  }
        
4.解决竞态问题的方法之自旋锁
  特点：
  1.自旋锁 = 自旋(忙等待) + 锁 //锁不会自旋
  2.自旋锁存在的价值在于它必须附加在某个共享资源上
  3.如果某个执行单元访问临界区之前要获取自旋锁而没有获取成功
    此执行单元将会原地忙等待,直到前一个执行单元释放自旋锁
  4.自旋锁保护的临界区要求执行速度要快,更不能进行休眠操作
    否则影响系统的性能    
  5.自旋锁能够解决除了中断所有的竞态问题
  
  数据类型：spinlock_t
  配套函数：
  //初始化自旋锁
  spin_lock_init(&自旋锁对象);
  //获取自旋锁,如果获取成功,立即返回;如果没有获取自旋锁
    任务将会原地死等"自旋"; 
  spin_lock(&自旋锁对象);
  //释放自旋锁
  spin_unlock(&自旋锁对象);
  
  编程使用步骤：
  1.明确驱动程序中哪些是共享资源
  2.明确驱动程序中哪些是临界区
  3.明确临界区中是否有休眠操作
    如果有,不考虑使用自旋锁
    如果没有,还要考虑是否有中断参与,如果有,也同样不能考虑
    如果没有中断,可以考虑使用自旋锁
  4.访问临界区之前获取自旋锁
    spin_lock(&自旋锁对象);
  5.踏踏实实访问临界区
    //会有多核引起的竞态问题？
    //会有进程的抢占？
  6.释放自旋锁
    spin_unlock(&自旋锁对象);
  7.获取锁和释放锁必须在逻辑上成对
    否则死锁
    
  参考代码：
  static int open_cnt = 1; //全局变量,(共享资源)
  static spinlock_t lock; //定义自旋锁对象
  //入口函数:spin_lock_init(&lock); //初始化自旋锁
  
  static int led_open(struct inode *inode, struct file *file)
  {
  	unsigned long flags;
  	
	//获取锁
	spin_lock(&lock);
  	//临界区
  	if (--open_cnt != 0) {
  		printk("设备已被打开!\n");
  		open_cnt++;
  		//释放自旋锁
  		spin_unlock(&lock);
  		return -EBUSY;
  	}
  	//释放自旋锁
  	spin_unlock(&lock);
  	printk("设备打开成功!\n");
  	return 0;
  }

5.解决竞态问题的方法之衍生自旋锁
  特点：
  1.衍生自旋锁是基于自旋锁扩展而来,具备自旋锁的全部特点  
  2.自旋锁能够解决所有的竞态问题,切记保护的临界区同样
    不能进行休眠操作
  
  数据类型：spinlock_t
  配套函数：
  //初始化自旋锁
  spin_lock_init(&自旋锁对象);
  //获取自旋锁并且屏蔽中断,如果获取成功,立即返回;如果没有获取自旋锁
    任务将会原地死等"自旋"; 
  spin_lock_irqsave(&自旋锁对象,flags);
  //释放自旋锁
  spin_unlock_irqrestore(&自旋锁对象,flags);
  
  编程使用步骤：
  1.明确驱动程序中哪些是共享资源
  2.明确驱动程序中哪些是临界区
  3.明确临界区中是否有休眠操作
    如果有,不考虑使用自旋锁
    如果没有,可以考虑使用自旋锁
  4.访问临界区之前获取自旋锁
    spin_lock_irqsave(&自旋锁对象,flags);
  5.踏踏实实访问临界区
    //所有的问题都能够解决
  6.释放自旋锁
    spin_unlock_irqrestore(&自旋锁对象,flags);
  7.获取锁和释放锁必须在逻辑上成对
    否则死锁
    
  参考代码：
  static int open_cnt = 1; //全局变量,(共享资源)
  static spinlock_t lock; //定义自旋锁对象
  //入口函数:spin_lock_init(&lock); //初始化自旋锁
  
  static int led_open(struct inode *inode, struct file *file)
  {
  	unsigned long flags;
  	
	//获取锁
	spin_lock_irqsave(&lock, flags);
  	//临界区
  	if (--open_cnt != 0) {
  		printk("设备已被打开!\n");
  		open_cnt++;
  		//释放自旋锁
  		spin_unlock_irqrestore(&lock, flags);
  		return -EBUSY;
  	}
  	//释放自旋锁
  	spin_unlock_irqrestore(&lock, flags);
  	printk("设备打开成功!\n");
  	return 0;
  } 
  
  案例：编写驱动程序,实现一个LED设备只被打开一次
  ARM执行：
  1.insmod led_drv.ko
  2../led_test & //启动A进程
  3.ps  //查看A进程的PID
  4../led_test //启动B进程
  5.kill A进程的PID //杀死A进程  

6.解决竞态问题的方法之信号量
  特点：
  1.信号量就是解决自旋锁保护的临界区不能休眠的问题
    有些场合临界区需要进行休眠,必须使用信号量
    信号量只能用于进程！
  2.信号量又称睡眠锁,信号量基于自旋锁实现的！
  3.要访问临界区的进程首先应该获取信号量,如果没有获取成功
    原地进入休眠状态,直到前一个进程释放信号量并且唤醒之前
    休眠的进程
  4.持有信号量的任务一旦访问临界区以后,首先唤醒之前休眠的
    进程并且将信号量丢给下一个进程
  
  数据结构：
  struct semaphore 
  
  配套函数：
  //初始化信号量,把它初始化为互斥信号量
  sema_init(&信号量对象, 1);  
  
  //获取信号量,如果进程没有获取信号量,进入将在此进入
  不可中断的休眠状态(只能由up来唤醒,如果应用程序发送kill信号,
  此休眠的进程不会立即响应此信号,直到被唤醒以后,休眠的进程
  会继续处理之前接受到的信号)
  down(&信号量对象);
  
  或者：
  
  //获取信号量,如果进程没有获取信号量,进入将在此进入
  可中断的休眠状态(不仅仅可以有up进行唤醒,睡眠期间如果接受到
  kill信号,休眠的进程会立即响应处理信号)
  down_interruptible(&信号量对象);
  一般要对此函数的返回值进行判断,返回非0表明进程是由于
  接收到了信号引起的唤醒;返回0表明进程被up唤醒
  
  //释放信号量,还要唤醒休眠的进程
  up(&信号量对象);
  
  编程操作步骤：
  1.明确驱动程序中哪些是共享资源
  2.明确驱动程序中哪些是临界区
  3.明确临界区中是否有休眠操作
    如果有,必须使用信号量
    如果没有,可以考虑使用信号量
  4.访问临界区之前获取信号量
  5.踏踏实实访问临界区
  6.释放信号量
  7.逻辑上要配对
  
  案例：采用down来获取信号量,实现一个设备只能被打开一次
  ARM执行：
  1.insmod led_drv.ko
  2../led_test & //启动A进程
  3.ps
  4../led_test & //启动B进程
  5.ps
  6.top  //获取A，B两个进程的系统资源(包括进程的状态)
    按Q键退出top命令
    A进程：  S -> 可中断的休眠状态
    B进程：  D -> 不可中断的休眠状态
    
  7.kill A进程
  8.top  //查看B进程的状态
  9.kill B进程
  
  10./led_test & //A
  11./led_test & //B
  12.ps
  13.top
  14.kill B进程
  15.top
  16.kill A进程
  
  案例：采用down_interruptible来获取信号量,实现一个设备只能被打开一次

7.解决竞态问题的方法之原子操作
  特点：
  1.原子操作 = 此操作具有原子性
             = 此操作期间不允许发生CPU资源的切换
  2.原子操作能够解决所有的竞态问题
  3.原子操作分位原子操作和整形原子操作
  
  位原子操作：=位操作具有原子性
              =位操作期间不允许发生CPU资源的切换
  本质：如果将来需要在驱动中对共享资源进行位操作,如果
  	考虑到竞态问题,可以考虑使用内核提供的位原子操作
  	的相关函数来避免竞态引起的异常
  位原子操作相关的函数：
  void set_bit(int nr, void *addr)//设置某个bit位为1
  void clear_bit(int nr, void *addr)//设置某个bit位为0
  void change_bit(int nr, void *addr)//把某个bit进行反转
  int test_bit(int nr, void *addr)//获取某个bit的值
  addr:数据的地址
  nr:第nr位(nr从0开始)
  各种组合函数(利用SI查看即可)
  切记：当对某个共享资源进行位操作,以上函数的操作具有原子性！
  
  参考代码：
  static int open_cnt = 1; //共享资源
  
  int led_open(...)
  {
  	open_cnt &= ~(1 << 0);//临界区,不具备原子性,危险的！	
  	return 0;
  }   
  
  优化以后的代码：
  方案1：采用中断屏蔽
  int led_open(...)
  {
  	unsigned long flags
  	local_irq_save(flags);
  	open_cnt &= ~(1 << 0);//临界区,不具备原子性,危险的！	
  	local_irq_restore(flags);
  	return 0;
  }  
  
  方案2:衍生自旋锁
  int led_open(...)
  {
  	unsigned long flags
  	spin_lock_irqsave(&lock, flags);
  	open_cnt &= ~(1 << 0);//临界区,不具备原子性,危险的！	
  	spin_unlock_irqrestore(&lock, flags);
  	return 0;
  }        
         
  方案3：信号量
  int led_open(...)
  {
  	down(&sema);
  	open_cnt &= ~(1 << 0);//临界区,不具备原子性,危险的！	
	up(&sema);
  	return 0;
  } 
  
  方案4：位原子操作
  int led_open(...)
  {
	clear_bit(&open_cnt, 0);
  	return 0;
  }
  
  
  采用down_interruptible来获取信号量,实现一个设备只能被打开一次
  加载驱动时,将全局变量值0x5555修改为0xaaaa
  不允许使用change_bit
  
  
```