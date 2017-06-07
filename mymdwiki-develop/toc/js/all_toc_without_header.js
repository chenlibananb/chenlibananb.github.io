(function($){
	var idindex=2;
	function create_toc(data,target,pid,path){
		pid=null==pid?0:pid;
		path=null==path?'':path;
		var curFolderId=(idindex++);
		target.push({
			'id'	:	curFolderId,
			'pId'	:	pid,
			'name'	:	null==data.folderName?"md":data.folderName,
			'open'	:	true
		});
		for(var i=0;i<data.folderlist.length;i++){

			create_toc(data.folderlist[i],target,curFolderId,path+"/"+data.folderlist[i].folderName);
		}
		var base=window.location.href.replace(/#md.*/,'#md/');
		for(var i=0;i<data.mdlist.length;i++){
			var curMdId=(idindex++);
			target.push({
				'id'	:	curMdId,
				'pId'	:	curFolderId,
				'name'	:	data.mdlist[i].name,
				'url'	:	base+path+"/"+data.mdlist[i].name,
				'open'	:	true
			});
			if(false)for(var j=0;j<data.mdlist[i].headerlist.length;j++){
				var curHeaderId=(idindex++);
				target.push({
					'id'	:	curHeaderId,
					'pId'	:	curMdId,
					'name'	:	data.mdlist[i].headerlist[j],
					'url'	:	base+path+"/"+data.mdlist[i].name+"#"+data.mdlist[i].headerlist[j].replace(/ *?#* */,'')+".cont",
					'open'	:	true
				});

			}
		}
	}
	/*
	 * 渲染ztree
	 */	
	function render_with_ztree(opts) {
		var t = $(opts._zTree);
		t = $.fn.zTree.init(t,opts.ztreeSetting,opts._header_nodes).expandAll(opts.is_expand_all);
		// alert(opts._headers * 88);
		// $(opts._zTree).height(opts._headers  * 33 + 33);
			
		$(opts._zTree).css(opts.ztreeStyle);
	}
	$.fn.ztree_all_toc_without_header = function(options) {
		// 将defaults 和 options 参数合并到{}
		var opts = $.extend({},$.fn.ztree_all_toc_without_header.defaults,options);
		
		return this.each(function() {
			opts._zTree = $(this);
			
			// 创建table of content，获取元数据_headers
			create_toc(opts.data,opts._header_nodes);
			
			// 根据_headers生成ztree
			render_with_ztree(opts);

		});
		// each end
	}
	//定义默认
	$.fn.ztree_all_toc_without_header.defaults = {
		_zTree: null,
		_headers: [],
		_header_offsets: [],
		_header_nodes: [{ id:1, pId:0, name:"Table of Content",open:true}],
		debug: true,
		highlight_offset: 0,
		highlight_on_scroll: true,
		/*
		 * 计算滚动判断当前位置的时间，默认是50毫秒
		 */
		refresh_scroll_time: 50,
		documment_selector: 'body',
		is_posion_top: false,
		/*
		 * 默认是否显示header编号
		 */
		is_auto_number: false,
		/*
		 * 默认是否展开全部
		 */	
		is_expand_all: true,
		/*
		 * 是否对选中行，显示高亮效果
		 */	
		is_highlight_selected_line: true,
		step: 100,
		ztreeStyle: {
			width:'260px',
			overflow: 'auto',
			position: 'fixed',
			'z-index': 2147483647,
			border: '0px none',
			left: '0px',
			bottom: '0px',
			// height:'100px'
		},
		ztreeSetting: {
			view: {
				dblClickExpand: false,
				showLine: true,
				showIcon: false,
				selectedMulti: false
			},
			data: {
				simpleData: {
					enable: true,
					idKey : "id",
					pIdKey: "pId",
					// rootPId: "0"
				}
			},
			callback: {
				beforeClick: function(treeId, treeNode) {
					$('a').removeClass('curSelectedNode');
					if(treeNode.id == 1){
						// TODO: when click root node
						console.log('click root table of content');
					}
					if($.fn.ztree_toc.defaults.is_highlight_selected_line == true) {
						$('#' + treeNode.id).css('color' ,'red').fadeOut("slow" ,function() {
						    // Animation complete.
							$(this).show().css('color','black');
						});
					}
				},
				onRightClick: function(event, treeId, treeNode) {
					if(treeNode.id == 1){
						// TODO: when right_click root node:table content
						console.log('right_click root table of content');
					}
				},
				onClick: function(event, treeId, treeNode){
					$('html, body').animate({  
						scrollTop: $(treeNode._url).offset().top  
					}, 3000);  
				}
			}
		}
	};
})(jQuery)