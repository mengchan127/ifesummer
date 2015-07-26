$(document).ready(function () {
	if(!initLocalStorage()) {
		return;
	}

	// current sort
	var curSort = 'default';  // sortID
	var curNote = {};  // 当前笔记内容，不是ID

	// 分类列表初始化
	freshSortList();
	
	// 笔记列表和内容区
	freshNoteList(curSort);

	/********* bind event ***********/
 	// add sort
	$('#add-cate').on('click', addSort);
	// choose a sort
	$('#cates').on('click', chooseSort);
	// delete a sort
	$('#del-cate').on('click', delCate);

	// new note
	$('#add-note').click(addNote);
	// drop edit
	$('#cancel-note').click(dropEdit);

	// finish note
	$('.finish-note').click(finishNote);

	// choose a note
	$('#notes>li').click(chooseNote);

	// delete note
	$('#del-note').click(delNote);

	// preview note
	$('#preview-note').click(previewNote);
	$('#edit-note').click(backEdit);

	// 点提示框右上角的‘X’关闭提示框
	$('#close-prompt').click(function(){
		$('#mask').hide();
		$('input[name="sort-name"]').val('');
	});
	$('#reset').click(function(){
		$('input[name="sort-name"]').val('');
	});

	/**************************** localStorage ****************************************************/

	/************** 获取localStorage中数据 ***************/
	function getData(attr) {
		if (window.localStorage[attr] === undefined) {
			return null;
		}
		var data = window.localStorage.getItem(attr);
		data = JSON.parse(data);
		return data;
	}
	/**
	 * 存储数据
	 * data是对象类型
	 */
	function saveData(attr, data) {
		var curdata = getData(attr);

		if (curdata === null) {
			var tmp = [];
			tmp.push(data);
			window.localStorage.setItem(attr, JSON.stringify(tmp));
			return true;
		} else if (data){
			curdata.push(data);
			window.localStorage.setItem(attr, JSON.stringify(curdata));
			return true;
		}
		return false;
	}

	/*********** init localStorage **********/
	function initLocalStorage() {
		if (!window.localStorage) {
			alert("your browser don't support localStorage");
			return false;
		}

		var storage = window.localStorage;

	    // 分类列表，默认分类的id为 default
		if (!storage.sorts) {
			storage.sorts = JSON.stringify([{
				sortId: 'default', 
				sortName: '默认分类',
				noteNum: 1
			}]);
		}
		// 笔记列表
		if (!storage.notes) {
			storage.notes = JSON.stringify([{
				id: 'n0001',
				title: '欢迎使用知识笔记',
				abstract: '欢迎使用个人知识笔记管理工具~',
				content: '欢迎使用个人知识笔记管理工具~ 期待您的宝贵意见哦 ^_^',
				sortId: 'default'
			}]);
		}
		return true;
	} 

	/*********** event  **********************************************************/

	/********** add sort *************/
	function addSort() {
		$('#mask').show();
		centerPrompt();
		$('#determine').click(function(){
			var sortName = $('input[name="sort-name"]').val();
			var curIds = getAttrValues('sorts', 'sortId');
			var id = produceId(curIds, 's');
			name = $.trim(sortName);
			if (sortName) {
				var tmpId = Math.random()*100
				var newSort = {
					sortId: id,
					sortName: name,
					noteNum: 0
				}
				if (saveData('sorts', newSort)) {
					var sorts = getData('sorts');
					freshSortList(sorts);
					$('#mask').hide();
				}
				else {
					alert('添加分类失败！');
				}
				$('input[name="sort-name"]').val('');
			}
		});

		$('input[name="sort-name"]').keyup(function(){
			var sortName = $('input[name="sort-name"]').val();
			sortName = $.trim(sortName);
			if(sortName) {
				$('#tip').html('');
			}
			else {
				$('#tip').html('不能为空');
			}	
		});
		

	}
	// 提示框居中显示
	function centerPrompt() {
		var left = (parseInt($(window).width()) - 360)/2;
		var top = (parseInt($(window).height()) - 240)/2;
		$('#prompt-box').css({'left': left, 'top': top});
	}
	// 随机生成id，并检测id的唯一性,返回id
	function produceId(arr, flag) {
		var id = Math.floor(Math.random()*10000);
		id = flag + id;
		for (var i = 0, len = arr.length; i < len; i++) {
			if (id === arr[i]) {
				break;
			}
		}
		if (i == len) {
			return id;
		}
		else {
			arguments.callee(arr, flag);
		}
	}
	// 获取全部id,返回存放id的数组
	// attr可能的取值为'sorts' 'notes', key取值为'id'
	function getAttrValues(attr, key) {
		var tmp = getData(attr);
		var result = [];
		for (var i = 0, len = tmp.length; i < len; i++) {
			result.push(tmp[i][key]);
		}
		return result;
	}

	/******** choose a Sort ********/
	function chooseSort(event) {
		var e = event || window.event;
		var target = e.target || e.srcElement;
		if (target.nodeName.toLowerCase() == 'li') {
			// change css style
			remClass('cates', 'active-sort');
			target.className = 'active-sort';
			// fresh note list
			var sortid = target.getAttribute('data-sortid');
			freshNoteList(sortid);

			// 保存当前的sortid
			curSort = sortid;
		}
	}
	// remove active-sort class
	// str取值为 'cates' 'notes'
	function remClass(str, classname) {
		var selector = '#'+str+' li';
		var lis = $(selector);
		for (var i = 0; i < lis.length; i++) {
			if (lis[i].className.indexOf(classname) != -1) {
				lis[i].className = '';
				break;
			}
		}
	}
	// fresh note list
	function freshNoteList(sortid, curnote) {
		var allNotes = getData('notes');
		// 该分类下的全部笔记
		var notes = [];
		for (var i = 0; i < allNotes.length; i++) {
			if (allNotes[i].sortId == sortid) {
				notes.push(allNotes[i]);
			}
		}
		var showedNote = curnote || notes[0]; // 内容去展示的笔记

		curNote = showedNote;

		// unbind events
		$('#notes li').off('click',chooseNote);

		var innerNote = '';
		if (notes[0]) { // 检测一个数组是否为[]，可以检测它的第一个元素
			for (i = 0, len = notes.length; i < len; i++) {
				if (notes[i].id === showedNote.id) {
					innerNote += '<li data-noteid="'+ notes[i].id +'" class="active-note">';
				}
				else {
					innerNote += '<li data-noteid="'+ notes[i].id +'">';
				}
				innerNote +=  '<h3>' + marked(notes[i].title) + '</h3>'
							+ '<p>' + marked(notes[i].abstract) + '</p>'
							+ '</li>';

				// 这要添加检测ul高度的函数，超过高度则显示导航条
			}
		}
		$('#notes').html(innerNote);

		// 内容区
		freshContent();
		
		$('#notes li').click(chooseNote);
	}
	// fresh content
	function freshContent() {
		if (curNote) {
			var title = marked(curNote.title);
			var content = marked(curNote.content);
			$('#note-title').html(title);
			$('.note-content').html(content);
		}
		else {
			$('#note-title').html('该分类下没有笔记哦 ^_^');
			$('.note-content').html('');
		}
	}

	// fresh sort list
	function freshSortList() {
		var sorts = getData('sorts');

		var innerSort = '';
		if (sorts) {
			for (var i = 0, len = sorts.length; i < len; i++) {
				if (sorts[i].sortId == curSort) {
					innerSort += '<li data-sortid="'+ sorts[i].sortId + '" class="active-sort">' + sorts[i].sortName + ' ( ' + sorts[i].noteNum + ' ) ' + '</li>';
				}
				else {
					innerSort += '<li data-sortid="'+ sorts[i].sortId + '">' + sorts[i].sortName + ' ( ' + sorts[i].noteNum + ' ) ' + '</li>';
				}
			}
			
		}
		$('#cates').html(innerSort);
	}

	/********** add note ********/
	function addNote() {
		$('#content-display').hide();;
		$('#content-preview').hide();
		$('#content-edit').show();
	}
	// finish note
	function finishNote() {
		var editTitle = $('#edit-title');
		var editContent = $('#edit-content textarea');

		var _title = editTitle.val();
		var _content = editContent.val();


		if (!_title) {
			alert('要给你的笔记起个名字哦~');
			return;
		}
		if (!_content) {
			alert('还没输入内容哦~');
			return;
		}

		// 存储笔记
		var allNotes = getData('notes');
		var _id = produceId(allNotes, 'n');
		var _abstract = _content.substring(0, 100);
		if (_content[100]) {
			_abstract = _abstract + '...';
		}

		var tmp = {
			id: _id,
			title: _title,
			abstract: _abstract,
			content: _content,
			sortId: curSort
		};

		saveData('notes', tmp);
		modifyNum(curSort, 'add');
		freshSortList();
		curNote = tmp;
		freshNoteList(curSort, curNote);

		editTitle.val('');
		editContent.val('');

		$('#content-display').show();;
		$('#content-preview').hide();
		$('#content-edit').hide();
	}

	// 修改某一分类下笔记数量
	// method取值可能为 'del' 'add'
	function modifyNum(sortid, method) {
		var sorts = getData('sorts');
		for (var i = 0, len = sorts.length; i < len; i++) {
			if (sorts[i].sortId == sortid) {
				switch (method) {
					case 'del': 
						sorts[i].noteNum -= 1;
					    break;
					case 'add': 
						sorts[i].noteNum += 1;
						break;
				}
				break;
			}
		}
		window.localStorage.removeItem('sorts');
		window.localStorage.setItem('sorts', JSON.stringify(sorts));
	}
	// drop edit  , cancel-note
	function dropEdit() {
		$('#content-display').show();;
		$('#content-preview').hide();
		$('#content-edit').hide();
	}
	// choose a note
	function chooseNote(event) {
		remClass('notes', 'active-note');
		this.className = 'active-note';

		var curnoteid = $(this).attr('data-noteid');
		curNote = getNote(curnoteid);
		freshContent();

		
	}
	// 根据id 返回note对象
	function getNote(id) {
		var result = {};
		var allNotes = getData('notes');
		for (var i = 0, len = allNotes.length; i < len; i++) {
			if (allNotes[i].id == id) {
				result = allNotes[i];
				break;
			}
		}
		return result;
	}
	/********** delete note ************/
	function delNote() {
		var flag = confirm('确定要删除该笔记？');
		if (flag) {
			var allNotes = getData('notes');
			if (curNote) {
				for(var i = 0; i < allNotes.length; i++) {
					if (allNotes[i].id == curNote.id) {
						allNotes.splice(i,1);
						break;
					}
				}
				window.localStorage.removeItem('notes');
				window.localStorage.setItem('notes', JSON.stringify(allNotes));

				curNote = {};

				modifyNum(curSort, 'del');

				freshSortList();
				freshNoteList(curSort);
			}
		}
	}

	/************** delete cate ****************/
	function delCate() {
		var flag = confirm('确定要删除该分类及分类下的所有笔记？');
		if (flag) {
			var allNotes = getData('notes');
			var sorts = getData('sorts');

			// 删除该分类下的笔记
			for (var i = 0; i < allNotes.length; i++) {
				if (allNotes[i].sortId == curSort) {
					allNotes.splice(i, 1);
				}
			}
			window.localStorage.removeItem('notes');
			window.localStorage.setItem('notes', JSON.stringify(allNotes));

			// 删除该分类
			for (var j = 0; j < sorts.length; j++) {
				if (sorts[j].sortId == curSort) {
					sorts.splice(j, 1);
					break;
				}
			}
			window.localStorage.removeItem('sorts');
			window.localStorage.setItem('sorts', JSON.stringify(sorts));

			location.reload();
		}
	}

	/************ preview note ***************/
	function previewNote() {
		// 先获取编辑区的内容
		var editTitle = $('#edit-title').val();
		var editContent = $('#edit-content textarea').val();

		var _title = marked(editTitle);
		var _content = marked(editContent);

		$('#preview-title').html(_title);
		$('#preview-content').html(_content);

		// 展示preview
		$('#content-display').hide();;
		$('#content-preview').show();
		$('#content-edit').hide();
	}
	function backEdit() {
		$('#content-display').hide();;
		$('#content-preview').hide();
		$('#content-edit').show();
	}

});

