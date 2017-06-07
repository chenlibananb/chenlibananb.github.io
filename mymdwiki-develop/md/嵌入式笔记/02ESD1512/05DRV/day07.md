```
回顾：
1.linux内核并发和竞态相关内容
  1.1.概念
  并发
  竞态
  共享资源
  互斥访问
  临界区
  执行路径具有原子性
  
  1.2.linux内核产生竞态的情形
  多核
  进程抢占
  中断进程
  中断中断
  
  1.3.linux内核提供解决竞态问题的方法
  中断屏蔽
  自旋锁
  信号量
  原子操作：位原子操作和整形原子操作
  
  1.4.原子操作之整形原子操作
  特点：
  整形原子操作 = 整形操作具有原子性
               = 整形操作时不会发生CPU资源的切换
  
  整形原子变量数据类型：atomic_t(假想为int型)
  
  使用：
  如果将来驱动程序需要对共享资源进行整型数的操作(加减运算),
  有考虑到竞态问题,可以考虑使用整形原子操作来解决竞态问题
  此时共享资源的数据类型不再是标准C的基本数据类型(int,long)
  应该把它定义为atomic_t数据类型；
  将来如果采用整形原子操作,内核同样提供了对整形原子变量操作
  的相关函数：
  ATOMIC_INIT
  atomic_add
  atomic_sub
  atomic_inc
  atomic_dec
  atomic_read
  atomic_set
  ... //各种组合函数
  atomic_dec_and_test(&tv) //tv自减1,如果tv的值为0,返回真,否则返回假
  
  例如：
  static atomic_t tv;
  atomic_add(2, &tv);
  
  参考代码：
  static int open_cnt = 1; //整形变量,共享资源
  int led_open(...)
  {
  	//临界区
  	if (--open_cnt != 0)//执行路径不具备原子性
  	{
  		open_cnt++;
  		....
  	}
  }
  
  优化：
  方案1：中断屏蔽
  方案2：自旋锁
  方案3：信号量
  方案4：整形原子操作
  static atomic_t open_cnt = ATOMIC_INIT(1); //定义整型原子变量
  					     //类似int open_cnt = 1
  int led_open(...)
  {
  	//临界区
  	if (!atomic_dec_and_test(&tv))//执行路径不具备原子性
  	{
  		printk("设备已被打开");
  		atomic_inc(&tv);
  		return -EBUSY;
  	}
  	printk("设备打开成功");
  	return 0;
  }	
  
  int led_close(...)
  {
  	atomic_inc(&tv);
  	return 0;
  }
  
*********************************************************
2.linux内核等待队列机制
  2.1.概念
  "等待"：分忙等待和休眠等待
  忙等待：任务处于忙等待就是原地空转,适用于等待时间极短
  休眠等待：进程处于休眠状态,进程会释放CPU资源
  等待队列中"等待"研究的是休眠等待,等待队列仅仅用于进程！
  切记：外设的处理速度远远慢于CPU
  2.2.等待队列概念
  明确：等待队列应用场合
  	例如：SecureCRT软件操作UART为例,看看整个软件操作UART
  	的过程：
  	1.SecureCRT软件运行时就是一个进程
  	2.此进程会操作硬件设备UART,进行读或者写,以读为例
  	3.当SecureCRT进程读UART时,发现UART数据没有准备就绪
  	  ,SecureCRT进程可以采用忙等待(轮询方式)不断读取UART
  	  如果轮询时间比较长,浪费CPU资源,此时此刻还可以考虑
  	  使用休眠等待,也就是SecureCRT进程进入休眠状态,释放
  	  它所占用的CPU资源给别的任务使用；
        4.将来UART一旦接收到了数据以后,UART势必给CPU发送
          一个中断信号,产生中断,此时此刻,只需在中断处理函数
          中唤醒之前休眠的进程SecureCRT(SecureCRT再次获取到CPU资源)
          SecureCRT进程再次投入运行,继续读取UART
          在这个过程中CPU可以干很多事情,提高了CPU的利用率
        5.总结等待队列"貌似"跟中断相关！
        
        6.问：如何让SecureCRT进程在驱动中进行休眠呢？
              因为SecureCRT调用read最终调用驱动的read函数
              驱动read函数操作UART硬件发现设备没有准备好数据
              进程在驱动read函数完成休眠等待
          答：驱动只需利用等待队列机制即可让进程进行休眠等待
        
        7.等待队列暗藏特点：
          回顾应用休眠函数：sleep
          回顾驱动休眠函数：msleep/ssleep
          以上函数也能够实现休眠等待,但是必须休眠足够的时间
          不能随时随地被唤醒,不够灵活；
          等待队列机制：能够让进程随时随地进行休眠
                        也能够随时随地被唤醒！      
  
  linux系统进程的状态：
  进程的运行状态：TASK_RUNNING
  进程的准备就绪状态：TASK_READY
  进程的休眠状态：
  	不可中断的休眠状态：TASK_UNINTERRUPTIBLE
  	   进程唤醒的方法只能是驱动主动唤醒,不会立即处理响应信号
  	   唤醒以后会处理
  	   
  	可中断的休眠状态:TASK_INTERRUPTIBLE
  	   进程唤醒的方法不仅仅由驱动主动唤醒,还能通过信号
  	   来唤醒
  	   
  2.3.利用等待队列实现进程休眠的编程步骤(老鹰抓小鸡)：
  1.类比
  老鹰<---->进程调度器(实现进程时间片的分配,进程的调度,进程CPU资源的切换
  			进程的抢占),操作的对象就是进程
  	    由内核已经实现！
  鸡妈妈<---->等待队列头(代表着等待队列的起始点,队列中每一节点
  			 代表就是一个要休眠的进程)
  小鸡<----->要休眠的进程
  总结：驱动要利用等待队列实现进程的休眠只需关注鸡妈妈和小鸡即可！
 
  2.编程实施步骤：
    1.定义初始化一个等待队列头(构造一个鸡妈妈)
      wait_queue_head_t wq; //定义等待队列头对象
      init_waitqueue_head(&wq);//初始化等待队列头
      注意：
      针对设备的不同操作可以定义多个等待队列头：
      例如对于所有的写进程,可以单独定义一个写等待队列头
          对于所有的读进程,可以单独定义一个读等待队列头
      一般定义成全局变量
           
    2.定义初始化装载休眠进程的容器(构造一个小鸡)
      wait_queue_t wait; //定义一个容器(仅仅代表一个进程)
      init_waitqueue_entry(&wait, current);//将当前进程塞到wait容器中
      "当前进程"：正在运行,正在获取CPU资源的进程
      current:内核全局指针变量,数据类型struct task_sturct
              此结构体用来描述进程,每当创建一个进程,内核就会
              给这个进程创建一个struct task_struct对象来描述
              此进程的信息：
              struct task_struct {
              	pid_t pid;进程的PID号；
              	char comm[TASK_COMM_LEN]; //进程名称
              	...
              }	
              current指针就指向当前进程对应的task_struct
              对象
              注意：current是动态变化的！
              调试信息：
              printk("%d, %s\n", current->pid, 
              			 current->comm);	 
       注意：小鸡应该定义成局部变量,例如：
       static uart_read(...)
       {
       		wait_queue_t wait; //定义一个容器(仅仅代表一个进程)
      		init_waitqueue_entry(&wait, current);//将当前进程塞到wait容器中
       		...
       } //只要有一个应用调用read函数,最终访问驱动的read
         //驱动的read就给这个进程定义一个容器(小鸡)      
           
     3.将要休眠的进程添加到等待队列中(让小鸡跟在鸡妈妈的后面)
       add_wait_queue(&wq, &wait);
       注意：
       此时此刻进程还没有真正的休眠
     4.设置进程的休眠状态
       set_current_state(TASK_INTERRUPTIBLE);//可中断
       或者
       set_current_state(TASK_UNINTERRUPTIBLE);//不可中断
       注意：
       此时此刻进程还没有真正的休眠
     5.进入真正的休眠状态
       schedule();//永久性休眠,当前进程会释放CPU资源
       注意：
       此时此刻,代码停止不前了,等待被唤醒(再次获取CPU资源)
       注意：
       不可中断和可中断的唤醒的方法是不一样的！
     6.一旦进程被唤醒,从schedule函数返回,代码继续往下执行,
       判断唤醒的原因(前提是休眠状态为可中断)
       if (signal_pending(current)) {
       	  printk("进程由于接收到了信号引起的唤醒\n");
       	  return -ERESTARTSYS;
       } else {
       	  printk("进程由于驱动主动唤醒\n");
       	  //读取UART数据
       }
     7.设置当前进程的状态为运行
       set_current_state(TASK_RUNNING);
     8.将当前唤醒的进程从等待队列中移除
       remove_wait_queue(&wq, &wait); 
     9.驱动主动唤醒的方法：
       一旦硬件准备好数据,硬件会给CPU发送中断信号
       只需在中断处理函数中唤醒之前休眠的进程
       wake_up(&wq);//将wq等待队列中所有的休眠进程进行唤醒
       或者
       wake_up_interruptible(&wq);//只唤醒休眠类型为可中断的休眠进程

案例：写进程唤醒读进程
ARM开发板操作：
1.insmod btn_drv.ko
2./btn_test r & //启动读进程A
 ./btn_test r & //启动读进程B
 ./btn_test r & //启动读进程C
 top
3./btn_test w //启动写进程D

4./btn_test r & //启动读进程A
 ./btn_test r & //启动读进程B
 kill A进程的PID   
 kill B进程的PID
 
案例：将以上驱动进行改造,最终完成一个完整的按键驱动
      用户需求：应用能够获取到按键的操作状态和按键值
      按键状态：1：表示按下；0：表示松开
分析：
1.当应用程序调用read读取按键信息,当按键无操作
  读进程应该进入休眠状态
2.一旦按键按下或者松开,势必产生中断,表明按键有操作
  唤醒之前休眠的进程,然后读进程将按键的状态和按键值上报给
  用户   

总结：按键程序执行过程：
应用read->驱动read,进入休眠->等待用户按键操作
按下操作->产生第一次中断->获取按键值和按键状态1->唤醒休眠读进程
读进程再次运行->将按键值和按键状态上报给用户

应用又调用read->驱动read,又进入休眠->等待用户按键操作
松开操作->产生第二次中断->获取按键值和按键状态0->唤醒休眠读进程
读进程再次运行->将按键值和按键状态上报给用户

3.linux内核等待队列机制编程方法2
  明确：编程方法2本质就是对以上等待队列编程的进一步封装
        让等待队列编程变得简化
  实施步骤：
  1.定义初始化等待队列头(构造鸡妈妈)
    wait_queue_head_t wq;
    init_waitqueue_head(&wq);
    
  2.调用一下两个宏即可完成进程的休眠过程
    wait_event(wq, condition);
    说明：
    wq:等待队列头对象
    condition:
    	如果condition为真,此宏立即返回,进程不进行休眠操作
    	如果condition为假,进程直接在此进入不可中断的休眠状态
    	代码停止不前,等待被唤醒      
    
    wait_event_interruptible(wq, condition);
    wq:等待队列头对象
    condition:
    	如果condition为真,此宏立即返回,进程不进行休眠操作
    	如果condition为假,进程直接在此进入可中断的休眠状态
    	代码停止不前,等待被唤醒      
      
   注意：以上两个宏实现了编程方法1的第2到第8步 
   
   3.唤醒的方法同上
   
   案例：利用编程方法2实现按键驱动
   切记：编程方法2的框架：
   休眠代码地方：
   wait_event_interruptible(wq, condition);
   condition = 0; //为了下一次休眠
   
   
   唤醒代码地方：
   condition = 1; //为了wait_event_interruptible能够返回
   wake_up(&wq);  				    
```