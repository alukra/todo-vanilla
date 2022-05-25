//Todo list
let data
init()

function init() {

	let boardList, list, prop

	//Retrieving data
	if (window.localStorage.mytodo)
		data = JSON.parse(localStorage.getItem("mytodo"))
	else {
		data = {
			'To do': [],
			'In Progress': [],
			'Done': []
		}
	}
	localStorage.setItem("mytodo", JSON.stringify(data))

	//Render
	boardList = document.getElementById('boardList')
	Object.keys(data).map(board => {

		//Creating the board
		prop = document.createElement('div')
		prop.classList.add('col-md-4')
		prop.innerHTML = `<div class="card todo-project">
				<div class="card-header todo-project__header">
					<p class="todo-project__title"> ` + board + `</p>
				</div>
				<ul class="list-group todo-project__list"></ul>
				<div class="card-footer">
					<div class="todo-project__total">
						<span class="todo-project__total-value"></span>
						<span class="todo-project__total-title"></span>
					</div>
				</div>
			</div>`
		boardList.appendChild(prop)
	})

	//Filling board
	list = document.querySelectorAll('.todo-project__list');
	Object.keys(data).map((board, index) => {
		data[board].map(task => {
			el = document.createElement('li')
			el.innerHTML = task
			el.className = 'todo-project__item list-group-item'
			list[index].appendChild(el)
		})
	})

	updateTotals()
}


function updateTotals() {
	let list, quantity
	list = document.querySelectorAll('.todo-project')
	Array.from(list).map(board => {
		quantity = board.getElementsByTagName('li').length;
		board.querySelector('.todo-project__total-value').innerHTML = quantity
		switch (quantity) {
			case 0: board.querySelector('.todo-project__total-title').innerHTML = 'empty'; break;
			case 1: board.querySelector('.todo-project__total-title').innerHTML = 'task'; break;
			default: board.querySelector('.todo-project__total-title').innerHTML = 'tasks';
		}
	})
}


//Add new task
document.querySelector('.todo-form').addEventListener('submit', function (e) {
	e.preventDefault()
	let input, val, allProj, i, proj, err

	input = document.querySelector('.add-task')
	val = input.value.trim();
	if (!val.length) return input.value = ''


	//validation
	allProj = document.querySelectorAll('.todo-project__item')
	for (i = allProj.length; i--;) {
		if (val.toUpperCase() === allProj[i].innerHTML.toUpperCase()) {
			input.value = ''
			err = document.getElementById('error-task')
			err.style.display = 'block'
			input.setAttribute('disabled', '');
			return setTimeout(function () {
				err.style.display = 'none'
				input.removeAttribute('disabled', '')
				input.focus();
			}, 1000)
		}
	}

	proj = document.createElement('li');
	proj.className = 'todo-project__item list-group-item';
	proj.innerHTML = val;
	document.querySelector('.todo-project__list').appendChild(proj);
	input.value = '';
	updateTotals();
	data['To do'].push(val);
	localStorage.setItem("mytodo", JSON.stringify(data));
})


//Drag and drop function

function getCoords(elem) {
	var box = elem.getBoundingClientRect();
	return {
		top: box.top + window.pageYOffset,
		left: box.left + window.pageXOffset
	}
}

var DragManager = new function () {
	var dragObject = {};
	var elem, elemW, avatar, old, def, mdown, mmove, mup;
	var busy = false;
	var trash = document.querySelector('.trash');

	function onMouseDown(e) {
		if ((e.which !== void 0) && (e.which != 1)) return;
		if (busy) return;
		if (document.querySelector('.disabled')) return;
		elem = e.target.closest('.todo-project__item');
		if (!elem) return;
		dragObject.elem = elem;
		dragObject.downX = e.pageX;
		dragObject.downY = e.pageY;
		elemW = elem.offsetWidth + 'px';
		old = {
			parent: elem.parentNode,
			nextSibling: elem.nextSibling
		};
		document.body.style.cursor = 'grab';
		return false;
	}

	function onMouseMove(e) {
		if (!dragObject.elem) return;
		if (!dragObject.avatar) {
			var moveX = e.pageX - dragObject.downX;
			var moveY = e.pageY - dragObject.downY;
			if (Math.abs(moveX) < 3 && Math.abs(moveY) < 3) {
				return;
			}
			dragObject.avatar = createAvatar(e);
			if (!dragObject.avatar) {
				dragObject = {};
				return;
			}
			var coords = getCoords(elem);
			dragObject.shiftX = dragObject.downX - coords.left;
			dragObject.shiftY = dragObject.downY - coords.top;
			startDrag(e);
		}
		dragObject.avatar.style.left = e.pageX - dragObject.shiftX + 'px';
		dragObject.avatar.style.top = e.pageY - dragObject.shiftY + 'px';
		trash.style.opacity = 1;
		onDragEnter(e);
		return elem;
	}

	function onDragEnter(e) {
		var dropElem = findDroppable(e);
		trash.style.fill = "#000";
		trash.style.transform = 'scale(1)';

		elem.hidden = false;
		if (!dropElem) {
			if (def) {
				old.parent.insertBefore(elem, old.nextSibling);
				def = false;
			}
			return false;
		}
		if (dropElem === trash) {
			elem.hidden = true;
			trash.style.fill = "#f00";
			trash.style.transform = 'scale(1.2)';
			return def = true;
		}
		if (dropElem.classList.contains('todo-project__list')) {
			dropElem.closest('.todo-project__list').appendChild(elem);
		}
		if (dropElem.classList.contains('todo-project__item')) {
			var pos = dropElem.offsetTop + (dropElem.offsetHeight / 2);
			if (e.pageY <= pos) {
				dropElem.parentNode.insertBefore(elem, dropElem);
			}
			else dropElem.parentNode.insertBefore(elem, dropElem.nextSibling);
		}
		elem.classList.add('disabled');
	}

	function onMouseUp(e) {
		if (dragObject.avatar) {
			finishDrag(e);
		}
		dragObject = {};
	}

	function createAvatar(e) {
		avatar = elem.cloneNode(true);
		avatar.classList.add('disabled');

		avatar.rollback = function () {
			var oldCoords = getCoords(dragObject.elem);
			avatar.style.transition = 'all .3s';
			avatar.style.left = oldCoords.left + 'px';
			avatar.style.top = oldCoords.top + 'px';
			busy = true;
			setTimeout(function () {
				busy = false;
			}, 300);
		};
		return avatar;
	}

	function startDrag(e) {
		elem.style.opacity = ".3";
		document.body.appendChild(avatar);
		avatar.style.zIndex = 9999;
		avatar.style.position = 'absolute';
		avatar.style.opacity = '.7';
		avatar.style.width = elemW;
	}

	function finishDrag(e) {
		var dropElem = findDroppable(e);
		elem = dragObject.elem;
		trash.style.opacity = 0;
		trash.style.fill = "#000";
		trash.style.transform = 'scale(1)';
		document.body.style.cursor = 'auto';
		removeData();
		if (!dropElem) {
			avatar.rollback();
			setTimeout(function () {
				avatar.parentNode.removeChild(avatar);
				elem.style.opacity = 1;
				elem.classList.remove('disabled');
				updateTotals();
			}, 300);
		} else {
			document.body.removeChild(avatar);
			if (dropElem === trash) {
				elem.parentNode.removeChild(elem);
				return updateTotals();
			}
			elem.classList.remove('disabled');
			elem.style.opacity = 1;
			updateTotals();
		}
		addData();
	}

	function findDroppable(e) {
		dragObject.avatar.hidden = true;
		var elem = document.elementFromPoint(e.clientX, e.clientY);
		dragObject.avatar.hidden = false;
		if (elem == null) {
			return null;
		}
		return (elem.closest('.todo-project__item') || elem.closest('.todo-project__list') || elem.closest('.trash'));
	}

	function removeData() {
		for (var prop in data) {
			data[prop].forEach(function (itm) {
				if (itm === elem.innerHTML) {
					data[prop].splice(data[prop].indexOf(itm), 1);
					localStorage.setItem("mytodo", JSON.stringify(data));
				}
			})
		}
	};

	function addData() {
		var i, list, ind, key, item;
		item = elem;
		function listIndex() {
			list = document.getElementsByClassName('todo-project__list');
			for (i = 0; i < list.length; i++) {
				if (list[i] === item.parentNode)
					return i;
			}
		}
		listIndex();
		key = Object.keys(data)[i];
		ind = [].indexOf.call(item.parentNode.children, item);
		data[key].splice(ind, 0, item.innerHTML);
		localStorage.setItem("mytodo", JSON.stringify(data));
	}

	document.ondragstart = function () {
		return false;
	};

	if (!Element.prototype.matches) {
		Element.prototype.matches = Element.prototype.matchesSelector || Element.prototype.webkitMatchesSelector || Element.prototype.mozMatchesSelector || Element.prototype.msMatchesSelector;
	}

	if (!Element.prototype.closest) {
		Element.prototype.closest = function (css) {
			var node = this;
			while (node) {
				if (node.matches(css)) return node;
				else node = node.parentElement;
			}
			return null;
		};
	}

	function touchTest() {
		if ('ontouchstart' in window || navigator.maxTouchPoints) {
			if (window.navigator.pointerEnabled) {
				mdown = 'pointerdown';
				mmove = 'pointermove';
				mup = 'pointerup';
			} else if (window.navigator.msPointerEnabled) {
				mdown = 'MSPointerDown';
				mmove = 'MSPointerMove';
				mup = 'MSPointerUp';
			} else {
				mdown = 'touchstart';
				mmove = 'touchmove';
				mup = 'touchend';
			}
		}
	}
	touchTest()

	function touchHandler(event) {
		var first = event.changedTouches[0],
			type = "";
		switch (event.type) {
			case mdown: type = "mousedown"; break;
			case mmove: type = "mousemove"; break;
			case mup: type = "mouseup"; break;
			default: return;
		}
		var simulatedEvent = document.createEvent("MouseEvent");
		simulatedEvent.initMouseEvent(type, true, true, window, event.detail,
			first.screenX, first.screenY,
			first.clientX, first.clientY, false,
			false, false, false, 0, null);
		first.target.dispatchEvent(simulatedEvent);
	}
	document.addEventListener(mdown, touchHandler);
	document.addEventListener(mmove, touchHandler);
	document.addEventListener(mup, touchHandler);
	document.onmousedown = onMouseDown;
	document.onmousemove = onMouseMove;
	document.onmouseup = onMouseUp;
}