var app = {
	onlineStatus: "",
	channels:{},
	pageReferer:null,
    defaultOrientation:null,
    device: null,
    eventName: 'touchend',
	isAndroidTV: typeof isAndroidTV == 'undefined' ? false : true ,
	lastSelected: '',
	lastpos: 0,
	templates:{
		'default':'AcJASxeId0Rm'
	},
	initialize: function () {
        if(typeof browsermode != 'undefined' && browsermode){
            app.device = {
                platform: 'web',
                model: 'chrome'
            }
            app.eventName = 'click'
        } else if(navigator.userAgent.toLowerCase().indexOf('tizen') > -1) {
            app.device = {
                platform: 'android',
                model: 'samsung'
            }
            app.eventName = 'click'
        }
		app.bindEvents();
	},
	bindEvents: function () {
		if(typeof browsermode != 'undefined' && browsermode){
            $( document ).ready(function() {
                app.onDeviceReady();
            });
        }
        else if(navigator.userAgent.toLowerCase().indexOf('tizen') > -1) {
           app.onDeviceReady();
        }else {        	
            document.addEventListener("deviceready",app.onDeviceReady,false);
        }
		document.addEventListener("online",app.onLine,false);
		document.addEventListener("offline",app.offLine,false);
	},
	onDeviceReady: function () {
		setTimeout(function () {
			if (navigator.splashscreen) {
				navigator.splashscreen.hide();
			}
        },3000);
		/* setup for mobile devices */
		if(typeof device != 'undefined'){
			app.device  = device;
			app.eventName = 'touchend';
		}
        if(app.device.platform != 'web' && typeof rollbar != 'undefined'){
            window.Rollbar = new rollbar({
                accessToken: "10cb4ad8785245b9bc8e39bd1e6f4ca4",
                captureUncaught: true,
                captureUnhandledRejections: true,
            })
        }

		$('body').addClass(app.device.platform.toLowerCase());
		if( navigator.maxTouchPoints == 0 &&  app.device.platform.toLowerCase() == 'android'){
			app.isAndroidTV = true;
			app.eventName = 'click';
		}
		if(app.isAndroidTV){
			$('body').addClass('androidTV');
		}
		app.bindDomEvents();
		app.bindCincopaEvents();
		app.bindeOnKeyEvent();
		if(app.device.platform == 'web'){
			app.remoteControls();
		}
		document.addEventListener("backbutton",app.onBackKeyDown,false);
		
		if (navigator.connection && navigator.connection.type != "none") {
			app.onlineStatus = "online";
		} else if (navigator.connection && navigator.connection.type == "none") {
			app.onlineStatus = "offline";
		}
		app.defaultOrientation =  (window.screen.orientation || {}).type;
		app.start();
	},
	addUserToStorage: function(user) {
		var users = localStorage.getItem('users');
		if(users){
			users = JSON.parse(users);
		}else{
			users = {};
		}
		if(users[user.uuid] && users[user.uuid].uid) {
			user.uid = users[user.uuid].uid;
		}
		users[user.uuid] = user;
		localStorage.setItem('users', JSON.stringify(users));
	},
	addChannelToList:function(channel_id,data){
		var channels = app.channels ? app.channels : {};
	
		channels[channel_id] = {};
		channels[channel_id] = data
		channels[channel_id].status = 'active';
		// localStorage.setItem('pairdChannels', JSON.stringify(channels));
	},
	setChannelStatus:function(channel_id,status){
		var channels = localStorage.getItem('pairdChannels');
		if(channels){
			channels = JSON.parse(channels);
		}else{
			channels = {};
		}

		if(channels[channel_id]){
			channels[channel_id].status = status;
		}
		app.channels = channels;
		localStorage.setItem('pairdChannels', JSON.stringify(channels));
	},
	removeChannelFromList:function(channel_id){
		var channels = localStorage.getItem('users');
		if(channels){
			channels = JSON.parse(channels);
		}else{
			channels = {};
		}
		delete channels[channel_id];
		app.channels = channels;
		localStorage.removeItem('users');
		localStorage.setItem('users', JSON.stringify(app.channels));
	},
	removeUserlFromList:function(user_id){
		var users = localStorage.getItem('users');
		if(users){
			users = JSON.parse(users);
		}else{
			users = {};
		}
		delete users[user_id];
		app.users = users;
		localStorage.setItem('users', JSON.stringify(users));
	},
	getPairdUsers:function(){
		var users = localStorage.getItem('users');
		if(users){
			return JSON.parse(users);
		}
		return {};
	},
	onLine: function () {
		if (app.onlineStatus != '' && app.onlineStatus != 'online') {
			app.onlineStatus = 'online';
			$('html').removeClass('offline').addClass('online');
		}
	},
	offLine: function () {
		if (app.onlineStatus != 'offline') {
			app.onlineStatus = 'offline';
			$('html').removeClass('online').addClass('offline');
		}
	},
	start:function(){
		app.users = app.getPairdUsers();
		var url = new URL(window.location);
		var uuid = url.searchParams.get('uuid');
		if(uuid){
			app.navigateTo('main');
			app.getUserDeviceChannnelList(uuid);
		}else if(app.users){
			$.each(app.users, function(index,el){
				app.getUsersList(el);
				// app.getUserDeviceChannnelList(index);
		   });
		}
		if( $.isEmptyObject(app.users )){
			app.navigateTo('addChannel');

		}else{
			app.navigateTo('channel-list');
		}
		
	},
	bindDomEvents: function () {
		/* bind dom element events here */
		window.addEventListener('keyboardDidHide', () => {
			// alert(999)
		});
		document.addEventListener("hidekeyboard", function() {
              
			// alert("hidekey");
				
		}, false);
		app.Nav = new hcOffcanvasNav('#main-nav', {
			customToggle: '.left-actions__menu',
			levelTitles: true,
			levelTitleAsBack: true,
		});
		app.Nav.on('close', function() {
			$('.selected').removeClass('selected');
		});
		app.Nav.on('open', function() {
			$('.selected').removeClass('selected');
			$('.nav-close-button').attr('data-bottom','.channelsList');
		});
		
		$('.left-actions__back').on('click',app.onBackKeyDown);

		$('[data-page]').on('click',function(){
			
			if( $(this).closest('#main-nav').length){
				return;
			}
			var direction = $(this).data('page');
			if(direction == 'channel-list' && jQuery.isEmptyObject(app.users)){
				app.navigateTo('addChannel');

				return false
			}

			app.navigateTo(direction);
			return false;
		});
		window.addEventListener('keyboardDidHide', function () {
			// alert(999)
		});
		$(".openContact").on(app.eventName,function(){
			if( $(this).closest('#main-nav').length){
				return;
            }
            if(app.device.platform === 'web'){
                window.open('https://www.cincopa.com/cincopatv/appcontact');
            }else {
                cordova.InAppBrowser.open('https://www.cincopa.com/cincopatv/appcontact', '_blank', 'location=yes,clearcache=no,clearsessioncache=no,cleardata=no,usewkwebview=yes');
            }
		});


		$(document).on(app.eventName, '.user-channel__item', function(){
			if($(this).hasClass('user-channel__item--expired')){
				return false;
			}
			var channel_id = $(this).data('uuid');
			app.getUserDeviceChannnelList(channel_id);;

		});
		$(document).on(app.eventName, '.channel-list__lastView--item', function(){
			$('body').addClass('show-embed-layer')
			var channel_fid = $(this).data('id');
			app.lastSeenVideo = $(this).data('rid');
			app.lastpos = $(this).data('lastpos')
			var lastselected = $(this);
			app.lastSelected = channel_fid;
			lastselected.addClass('lastSelected');
			app.getChannelContent(channel_fid);

		});

		$(document).on(app.eventName, '.channels-list__item', function(){
			if($(this).hasClass('channels-list__item--expired')){
				return false;
			}
			var channel_fid = $(this).data('channel_fid');
			var lastselected = $(this);
			lastselected.addClass('lastSelected')
			app.getChannelContent(channel_fid);

		});
		$(document).on("touchstart", "#main .channels-list__item", function(e){
			$(this).addClass('channels-list__item--hovered');			
		});
		$(document).on("touchend", "#main .channels-list__item", function(e){
			$('#main .channels-list__item').removeClass('channels-list__item--hovered');			
		});
		$(document).on(app.eventName, '.channels-list__remove', function(){
			var channel_id = $(this).closest('.user-channel__item').data('uuid');
			app.removeChannelFromList(channel_id);
			app.getUsersList(channel_id);
			return false;
		});

		$(document).on(app.eventName, '.channels-list__pair', function(){
			app.navigateTo('addChannel');

		});	

		
		/* create pair code plugin */
		var non_number = String.fromCharCode('0x25CF');
		$('.pair__input').html(non_number)
		$('.pair__input').on('click', function(){
			$('.pair__code').focus();
		})

		$('.pair__code').on('blur', function(e){
			// alert('blur')
		})

		$('.pair__code').on('keyup', function(e){
			var number = $(this).val();
			// alert(e.keyCode)
			for (var i = 0; i < 6; i++){
				var inum = number[i] || non_number;
				var currentElement = $('.pair').find('.pair__input').eq(i);
				currentElement.html(inum);
				if(inum == non_number){
					currentElement.addClass('pair__input--gray');					
				}else{
					currentElement.removeClass('pair__input--gray');					
				}
			}

			var pairCode = $(this).val();			
			if(pairCode &&  String(pairCode).length >= 6){
				pairCode =  String(pairCode).substr(0,6);
				app.pairChannel(pairCode);
				setTimeout(function(){
					$('.pair__input').html(non_number).addClass('pair__input--gray');
					$('.pair__code').val('');
					$('.pair__code').blur();
				}, 500);
			}
		});
	},
	getLastSeen:function(){
		var lastSeenVideos = localStorage.getItem('lastSeen');
		if(lastSeenVideos){
			lastSeenVideos = JSON.parse(lastSeenVideos);
		}else{
			lastSeenVideos = {};
		}
		return lastSeenVideos[app.current_chunnel_id];
	},
	saveLastSeen: function(data){
		var newlastSeen = {
			channel_fid: app.current_channel_fid,
			channel_id: app.current_chunnel_id,
			id: data.id,
			rid: data.item.rid,
			thumbnail: data.item.versions.jpg_600x450 ? data.item.versions.jpg_600x450.url : data.item.thumbnail_url,
			title: data.item.title,
			descr: data.item.description,
			second: data.second,
			duration: app.cp_hmsToSecondsOnly(data.item.duration),
		}

		var lastSeenVideos = localStorage.getItem('lastSeen');
		if(lastSeenVideos){
			lastSeenVideos = JSON.parse(lastSeenVideos);
		}else{
			lastSeenVideos = {};					
		}
		if(!lastSeenVideos[app.current_chunnel_id] || !app.isAndroidTV){
			lastSeenVideos[app.current_chunnel_id] =  {}
		}
		lastSeenVideos[app.current_chunnel_id][app.current_channel_fid] = newlastSeen;	
		// lastSeenVideos[]	
		localStorage.setItem('lastSeen', JSON.stringify(lastSeenVideos));
    },
    updateLastSeen:function(data){
        var lastSeenVideos = app.getLastSeen();
		if(lastSeenVideos){
			var htm = app.generateLastView(lastSeenVideos);
			$('.channel-list__lastView').html(htm);
			app.lastSelected = '';
		}
    },
	bindCincopaEvents:function(){
		window.cincopa.registeredFunctions.push({
			func: function (name, data, gallery) {
				switch (name) {
					case 'runtime.on-args':
						gallery.args.cincopaTV = true;
						break;
					case 'runtime.on-load-html':
						var users = localStorage.getItem('users');
						users = JSON.parse(users)
						$.each(users,(key) => {
							users[key].uid = data.uid;
						})
						localStorage.setItem('users', JSON.stringify(users));
						app.hideLoader();
						/* embed code container remove workaround from app */
						$('.embedimageContainer').remove();
						break;
					case "api.ready": 
					if(app.lastSeenVideo){
						gallery.playerAPI.goTo(app.lastSeenVideo);
					}
					break;				
					case 'skin.load':
						app.gallery = gallery;
						if(app.isAndroidTV){
							var galleryContainer = $('#cincopa_'+app.current_channel_fid);
							galleryContainer.find('a.cp_pl_item').first().parent().addClass('selected');
							galleryContainer.find('.selected')[0].scrollIntoView({behavior:'smooth',block: 'start'});
							galleryContainer.find('.slides li').attr({'data-right': 'next', 'data-left': 'prev'});
							galleryContainer.find('.slides li').first().attr({'data-left' : ''});
							galleryContainer.find('.slides li').last().attr({'data-right' : 1} );

						}
						//Menu.print_video_header(title);
					break;
					case 'video.load':
						var controls = gallery.skin.player.controls[0];

					if(app.lastSeenVideo){
						gallery.playerAPI.setCurrentTime(app.lastpos);
						delete app.lastSeenVideo;
					}
					if(app.isAndroidTV) {
						gallery.playerAPI.getControlsContainer().querySelector('.mejs-gear-button').remove();
						gallery.playerAPI.getControlsContainer().querySelector('.mejs-fullscreen-button').remove();
					}

					break
					case 'video.play':
						$('body').removeClass('show-embed-layer');
						//Menu.hide_header();
					break;
					case 'video.timeupdate':
						 app.saveLastSeen(data);
						break
					case 'video.pause':
						//Menu.show_header();
					break;
					case 'video.ended':
						//window.history.back();
					break;
					case 'video.fullscreenenter':
						app.defaultOrientation = screen.orientation.type;
						window.screen.orientation.lock('landscape');
						if(app.device.platform.toLowerCase() == 'android'){
							AndroidFullScreen.isSupported(function(){
								AndroidFullScreen.immersiveMode(function(){
									console.log('immersiveMode success');
								}, function(){
									console.log('immersiveMode error');
								});
							}, function(){
								console.log('not supported');
							});	
						}
															
					break;
					case 'video.fullscreenexit':
						if(app.defaultOrientation){
							window.screen.orientation.lock(app.defaultOrientation);
						}else{
							window.screen.orientation.lock('portrait');
						}
						if(app.device.model.toLowerCase().indexOf('ipad') > -1){
							window.screen.orientation.unlock();
						}						
						if(app.device.platform.toLowerCase() == 'android'){
							AndroidFullScreen.showSystemUI(function(){
								console.log('return back to systemui');
							}, function(){
								console.log('cant return back to systemUI');
							});	
						}	
					break;
				}
			}, 
			filter: "*"
		});

	},
	guidGenerator:function(){
		var S4 = function() {
			return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
		};
		return ('cp'+S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
	},
	onBackKeyDown: function () {
		if(app.Nav.isOpen()){
			app.Nav.close();
			return;
		}
		if($('.pair__code').is(":focus")) {
			$('.pair__code').blur();
			return;
		}
		if(app.isAndroidTV){
			var activePage = 	$('body').attr('data-active-page');
			if (app.pageReferer) {
				if(activePage == "main"){
					app.navigateTo('channel-list');
				}else if(activePage == "channel-list" || activePage == "addChannel" ){
					navigator.app.exitApp();
				}else if(app.pageReferer == 'main') {
					if($('.lastSelected').length > 0){
						app.navigateTo('main');
						app.updateLastSeen();
						$('.lastSelected').addClass('selected').removeClass('lastSelected')[0]
						.scrollIntoView({behavior:'smooth',block: 'center'});

					}else {
						app.navigateTo('main');
					}
				}else {
					app.navigateTo('main');
				}
			}else {
				navigator.app.exitApp();
			}
		}else{
			if (app.pageReferer) {
				var activePage = 	$('body').attr('data-active-page');
				if(activePage == "main"){
					navigator.app.exitApp();
				}else if(activePage == app.pageReferer){
					app.navigateTo('main');	
				}else{
					app.navigateTo(app.pageReferer);
					app.hideLoader(); /* to not show that some process still trying to load content */
				}
			}else{
				app.navigateTo('main');
			}
		}

	},
	remoteControls:  function(){
		var remoteControlsBlock = document.createElement('div');
		remoteControlsBlock.className = 'remoteControlsBlock cp-hide'
		var remoteControlBtn = document.createElement('div');
		remoteControlBtn.className = 'remoteControlBtn ';
		remoteControlBtn.innerText = 'TV remote';
		remoteControlsBlock.appendChild(remoteControlBtn);

		$(remoteControlBtn).on(app.eventName,function() {
			$('.remoteConstrols').toggleClass('cp-hide');
			$('.back-button').toggleClass('cp-hide');
		}) 
		var remoteConstrols = document.createElement('nav');
		remoteConstrols.className = 'remoteConstrols cp-hide';

		var topControl = document.createElement('a');
		topControl.className = 'btn top';
		topControl.innerHTML = '<i class="icon-play">';
		remoteConstrols.appendChild(topControl);

		$(topControl).on(app.eventName,() => {
			app.controlsClickUpDown('up');
		})

		var rightControl = document.createElement('a');
		rightControl.className = 'btn right';
		rightControl.innerHTML = '<i class="icon-forward">';
		remoteConstrols.appendChild(rightControl);

		$(rightControl).on(app.eventName,function() {
			app.controlsClickRL(5);
		})

		var leftControl = document.createElement('a');
		leftControl.className = 'btn left';
		leftControl.innerHTML = '<i class="icon-backward">';
		remoteConstrols.appendChild(leftControl);

		$(leftControl).on(app.eventName,function() {
			app.controlsClickRL(-5);
		})

		var bottomControl = document.createElement('a');
		bottomControl.className = 'btn bottom';
		bottomControl.innerHTML = '<i class="icon-pause">';
		remoteConstrols.appendChild(bottomControl);

		$(bottomControl).on(app.eventName,() => {
			app.controlsClickUpDown('down');
		})

		var centerControl = document.createElement('a');
		centerControl.className = 'center-button';
		centerControl.innerHTML = '<i class="icon-stop">';
		remoteConstrols.appendChild(centerControl);

		$(centerControl).on(app.eventName,function(){
			app.controlsClickCenter()
		})
		var backBtn = document.createElement('a');
		backBtn.className = 'back-button cp-hide';
		backBtn.innerHTML = `<i class="channels-list__remove zmdi zmdi-arrow-left"></i>`;
		$(backBtn).on(app.eventName,function(e)  {
			e.preventDefault();
			e.stopPropagation();
			app.controlsClickBack();
		})


		remoteControlsBlock.appendChild(remoteConstrols);
		remoteControlsBlock.appendChild(backBtn);

		document.querySelector('.container').appendChild(remoteControlsBlock);
		
		
		
	},
	controlsClickBack: function() {
		var activePage = document.querySelector('.page--active')
		if(activePage.id == 'channel'){
			if($('.netflix_popup_opened').length){
				$('.netflix_close_btn').trigger('click')

			}else {
				app.navigateTo('main')

			}
		}
	},
	controlsClickCenter: function() {
		var activePage = document.querySelector('.page--active')
		// if(activePage.id == 'main'){
		// 	var selectedGallery = $('.selected','#main');
		// 	$(selectedGallery).trigger( app.eventName );
		// }else 
		if(activePage.id == 'channel'){
			var galleryContainer = $('#cincopa_'+app.current_channel_fid);
			if($('.netflix_popup_opened').length == 0){
				var videoPlay = galleryContainer.find('a.cp_pl_item').parent('.selected')
				if(videoPlay.length > 0){
					videoPlay.children()[0].click();
				}
			}else {
				var playlist = $('.mediaElement-top-bar');
				var controls = app.playerAPI().getControlsContainer();

				if($('#cincopa_'+app.current_channel_fid).hasClass('status-pause')){
					clearTimeout(hideControls);
					app.playerAPI().play();
					app.playerAPI().showControls();
					
					var hideControls = setTimeout(function () {
						$(controls).removeClass('ze-active-controls');
						$(playlist).removeClass('cp_show');
					},3000)
				}else {
					app.playerAPI().pause();
					$(controls).addClass('ze-active-controls');
					$(playlist).addClass('cp_show');
						

				}
			}

		}else {


			if($('.selected').closest('.nav-content').length > 0){
				app.Nav.close();
			}
			$('.selected').trigger(app.eventName);


		}
		// else if(activePage.id == 'channel-list') {
		// 	var channel = $('.user-channel__item.selected')
		// 	if(channel.hasClass('user-channel__item--expired')){
		// 		return false;
		// 	}
		// 	var channel_id = channel.data('uuid');
		// 	app.getUserDeviceChannnelList(channel_id);
		// }else if(activePage.id == 'addChannel') {
		// 	$('.pair__code').focus();

		// }
	},
	controlsClickRL: function(value,keycode){
		var activePage = document.querySelector('.page--active')
		if(activePage.id == 'channel' && $('.netflix_popup_opened').length){

				var playlist = $('.mediaElement-top-bar');
				var controls = app.playerAPI().getControlsContainer();

				clearTimeout(hideControls);
				$(controls).addClass('ze-active-controls');
				$(playlist).addClass('cp_show')
					
				var hideControls = setTimeout(function() {
					$(controls).removeClass('ze-active-controls');
					$(playlist).removeClass('cp_show')
				},3000)
				
			var currentTime = app.playerAPI().currentTime();
			app.playerAPI().setCurrentTime(currentTime + value);

		}
		// else if( app.isAndroidTV){
		// 	if( keycode == 39) {
		// 		app.controlsClickUpDown('down');
		// 	}else if(keycode == 37) {
		// 		app.controlsClickUpDown('up');
		// 	}
		// }
	},
	scroolleftRight: function(width,index,$scrollableArea) {
		if($scrollableArea[0].scrollWidth - width * index > $scrollableArea[0].offsetWidth) {
			$scrollableArea.css({'transform': 'translate(-'+ width * index +'px, 0)'})
		}else {
			translate = $scrollableArea[0].scrollWidth - $scrollableArea[0].offsetWidth;
			$scrollableArea.css({'transform': 'translate(-'+ translate +'px, 0)'})
		}
	},
	controlsClick: function (id,keyCode) {
		var $headerExsist = $('.header--shadow');
		var selectedItem = $('.selected');
		var element;
		if(app.Nav.isOpen() && selectedItem.length == 0 ){
			$('nav .nav-item').first().find('a').addClass('selected');
		}else if(selectedItem.length > 0){
			selectedItem[0].scrollIntoView({behavior:'smooth',block: 'center'});
			var attrName = 'data-'+id;
			var goTo = $('.selected').attr(attrName);
			if(typeof goTo == 'undefined'){
				return false
			}
			if( goTo == 'prev'){
				element   = $('.selected').prev();
			}else if(goTo == 'next'){
				element   = $('.selected').next();
			}else if(goTo == 'scrollup'){
				$('.page--active')[0].scrollIntoView({behavior:'smooth',block: 'start'});
				return false;
			}else if(goTo == 'scrolldown'){
				$('.page--active')[0].scrollIntoView({behavior:'smooth',block: 'end'});
				return false;
			}else{
				element = $(goTo);
			}
			
			if(element.length == 0 ) {
				return false;
			}
			selectedItem.removeClass('selected');
			element.addClass('selected');
			element[0].scrollIntoView({behavior:'smooth',block: 'center'});
		}else {
			if($headerExsist.css('display') != 'none'){
				$('.left-actions__menu').addClass('selected');
			}else {
				$('.page--active [data-left]').first().addClass('selected')
			}
		}

	},
	bindeOnKeyEvent: function() {
		window.addEventListener("keydown", moveSomething, false);
		function moveSomething(e) {
			var ctivePage = $('.page--active')[0].id
			var isAndroidTV = $('.body').hasClass('androidTV')
			switch(e.keyCode){
			case 37: //LEFT arrow
				e.preventDefault()
				if($('.page--active')[0].id == "channel" && $('.netflix_popup_opened').length){
					app.controlsClickRL(-10)
				}else {
					app.controlsClick('left');
				}
				break;
			case 38: //UP arrow
				e.preventDefault()
				app.controlsClick('top');
				break;
			case 39: //RIGHT arrow
				e.preventDefault()
				if($('.page--active')[0].id == "channel" && $('.netflix_popup_opened').length){
					app.controlsClickRL(10)
				}else {
					app.controlsClick('right');
				}
				break;
			case 40: //DOWN arrow
				e.preventDefault()
				app.controlsClick('bottom');
				break;
			case 13: //OK button
				e.preventDefault()
				app.controlsClickCenter();
				break;
			case 179: //Android TV PLAY/PAUSE button
				console.log(e,'event');

				if(ctivePage == 'main' && $('.selected.channel-list__lastView--item').length  ) {
					$('.selected').trigger(app.eventName);
				}
				if( ctivePage == 'channel') {
					app.controlsClickCenter();
				}

				break;
			case 8: 
				if($('.lastSelected').length > 0){
					app.navigateTo('main');
					$('.lastSelected').addClass('selected').removeClass('lastSelected')[0]
					.scrollIntoView({behavior:'smooth',block: 'center'});
					app.lastSelected = '';
				}
				break;
			case 10009: /* tizen back key */
				app.onBackKeyDown();
				break;
			default:
				
				break;
			}
		};
	},
	playerAPI: function (){		
		if(app.gallery){
			return app.gallery.playerAPI;
		}else{
			return false;
		}
	},
	navigateTo: function (page,callback) {
		if(page == 'addChannel' || page == "channel-list") {
			$('body').append('<div class="app-version">version - 1.0.21 (10.19.21) </div>')
		}else {
			$(".app-version").remove();
		}
		if(app.device.platform == 'web' ){

			if(page == 'addChannel' || page == 'channel-list'){
				$('.remoteControlsBlock').addClass('cp-hide')
			}else {
				$('.remoteControlsBlock').removeClass('cp-hide')
			}
		}
		if(app.isAndroidTV) {
			
			$('.selected').removeClass('selected')
			if(page == 'addChannel'){
				$('.right-actions__plus').attr('data-bottom', '.pair__input:first') ;
				$('.left-actions__menu').attr('data-bottom','.pair__input:first') ;
				setTimeout(function() {
					$('.pair__input').first().trigger('click');
				})
			}else if(page == 'channel-list'){
				$('.right-actions__plus').attr('data-bottom', '.user-channel__item:first') ;
				$('.left-actions__menu').attr('data-bottom','.user-channel__item:first') ;
				$('.user-channel__item').first().addClass('selected')
			}

		}

		if ($('#' + page).hasClass('page--active')) {
			return false;
		} else {

			var id = $(".page--active").attr('id');
			if($('#' + id).data('ref') != false){
				app.pageReferer = id;
			}
			$('.page').removeClass('page--active ');
		}

		/* clean any embedded gallery on page change */
		if(page != 'channel'){
			$('.channel').html('');
			$('html').removeClass('cp_overflow_hidden'); /* class added by skin */
		}
		// switch(page){
		// 	case 'channel':
		// 		app.setHeaderTitle();
		// 		break;
		// }
		app.setHeaderTitle();
		$('#' + page).addClass("page--active");

		window.scrollTo(0,0);
		$('body').attr('data-active-page',page)
		if (typeof callback == 'function') {
			callback();
		}

	},
	getChannelContent:function(channel_fid){
		app.navigateTo('channel');
		app.current_channel_fid = channel_fid;
		app.drawChannel(channel_fid,app.channels.name);
		// delete app.channel_user;
		// app.current_channel_id = channel_id;
		// app.showLoader();
		// if(app.currentFeedData){
		// 	delete app.currentFeedData;
		// }
		// $.ajax({
		// 	url:'https://3genrib1y0.execute-api.us-east-1.amazonaws.com/public/channels/'+channel_id+'/feed',
		// 	type: "GET",
		// 	dataType:'json',
		// 	success:function(res){
		// 		if(res.success){
		// 			app.channel_user = res.user;
		// 			var channelName = app.channels.name;
		// 			app.navigateTo('channel');
		// 			app.drawChannel(res,channelName);					
					
		// 		}else if(res.error){
		// 			app.setChannelStatus(channel_id,res.error.toLowerCase());
		// 			// app.drawChannels(channel_id,res.galleries);
		// 		}
		// 	},
		// 	error:function(err){
		// 		if(app.onlineStatus == "offline"){	
		// 			app.showErrorAlert('There is no internet connection, please check',null,'Connection Error','Ok');	
						
		// 		}else {	
		// 			alert(JSON.stringify(err));	
		// 		}
		// 	},
		// 	complete:function(){
		// 		app.hideLoader();
		// 	}
		// });

	},
	pairChannel:function(code){
		app.showLoader();
		$('.pair-message').html('');
		$.ajax({
			url:'https://3genrib1y0.execute-api.us-east-1.amazonaws.com/public/users',
			type: "POST",
			contentType:'application/json',
			dataType:'json',
			data:JSON.stringify({
				"pair_code":code,
				"platform": app.device.platform.toLowerCase()
			}),
			success:function(res){
				if(res.success){
					app.addUserToStorage(res.user);
					app.getUsersList(res.user);

					
				}else{
					$('.pair-message').text(res.message || 'Issue with pair code.');
				}
			},
			error:function(err){
				if(app.onlineStatus == "offline"){	
					app.showErrorAlert('There is no internet connection, please check',null,'Connection Error','Ok');	
						
				}else {	
					alert(JSON.stringify(err));	
				}
			},
			complete:function(){
				app.hideLoader();
			}
		});
	},
	getUsersList: function(userId){
	
		var htm = '';
		app.users = app.getPairdUsers();
		var index = 0;
		var objectlength = Object.keys(app.users).length;
		
		$.each(app.users,function(i,data){	
			htm += '<div class="user-channel__item'+(data.status=="expired"?"user-channel__item--expired":"")+'" \
			data-uuid="'+data.uuid+'"\
			data-right=".selected .channels-list__remove"\
			data-top="'+(index == 0 ? '.left-actions__menu' : 'prev')+'"\
			data-bottom="'+(index == objectlength - 1 ? '.user-channel__item:first' : 'next')+'">\
			<div>'+data.vendor_name + (typeof data.name == 'undefined' ? '': '-'+ data.name ) + (data.status=="expired"? '<div class="showMessage">expired</div>' : '<div class="showMessage"></div>') +' </div> <i class="channels-list__remove  zmdi zmdi-delete" data-left=".user-channel__item:has(> .selected)"></i></div>';
			index++;
		});
		$('#channel-list .channel-lists').html(htm);
		if(jQuery.isEmptyObject(app.users)){
			app.navigateTo('addChannel');

		}else {
			app.navigateTo('channel-list');
		}

		// var users = $('<div class="channels"><div>'+data.name+' </div><div>'+data.uuid+' </div> </div>');
		
	},
	expired: function(userId){
		
		app.users[userId].status = 'expired';
		localStorage.setItem('users', JSON.stringify(app.users));
		$(`.user-channel__item[data-uuid=${userId}] .showMessage`).html('expired');
			// htm += '<div class="user-channel__item" data-uuid="'+data.uuid+'"><div>'+data.vendor_name+'-'+data.name+' </div> <i class="channels-list__remove zmdi zmdi-delete"></i></div>';


		
	},
	getUserDeviceChannnelList: function(userId) {

		$.ajax({
			url:'https://3genrib1y0.execute-api.us-east-1.amazonaws.com/public/users/'+userId+'/channels',
			type: "GET",
			dataType:'json',
			success:function(res){
				if(res.success){
					if(res.galleries.length > 0){

						app.navigateTo('main');
						for(var i = 0; i < res.galleries.length ; i++){
							app.addUserToStorage(res.user)
								app.addChannelToList(res.galleries[i].uuid,res.galleries[i]);
								app.current_chunnel_id =  userId;
								app.drawChannels(userId,res.galleries);
								
						}
					}
				}else{
					if(res.error == "Expired"){
						// app.removeUserlFromList(userId);
						app.expired(userId)
					}else if(res.error == "NotFound") {
						
						if(app.users){
							$.each(app.users, function(index,el){
								app.getUsersList(el);
						   });
						//    app.navigateTo('channel-list');

						}else {
							app.navigateTo('addChannel');

						}
					}
					$('.pair-message').text(res.message || 'Issue with pair code.');
				}
			},
			error:function (err){
				if(app.onlineStatus == "offline"){	
					app.showErrorAlert('There is no internet connection, please check',null,'Connection Error','Ok');	
						
				}else {	
					alert(JSON.stringify(err));	
				}
			},
			complete:function(){
				app.hideLoader();
			}
		});
	},
	drawChannel:function(fid,channelName){
		if(app.channel_user){
			window.cincopa = window.cincopa || {};
			window.cincopa.analytics = {
				email: app.channel_user.email,
				name: app.channel_user.name,
				id: app.channel_user.id
			};

		}
		// var url = new URL(res.channel.content);
		// var fid = url.searchParams.get('fid');
		// url.searchParams.set('fid',app.templates.default+'@'+fid );
		// url.searchParams.set('id',new_guid);
		// url.searchParams.set('ver','v2');
		$('.channel').html('');
		var newEmbedCode = `
		<div class="embed-layer" style="background-image: url(https://rtcdn.cincopa.com/thumb.aspx?fid=${fid}&size=xlarge)"></div>
		<div id="cincopa_${fid}" class='gallerydemo cincopa-fadein'     >
									<div class="embedimageContainer" style='width: 100%; height: 100vh; max-width: 100%;'>
										<!--<img src='https://rtcdn.cincopa.com/thumb.aspx?fid=${fid}&size=xlarge' style='filter:blur(5px);heiXght:100%;object-fit:cover;width:100vw;height: 100vh' onload='this.parentNode.style.opacity=1;' />-->
									</div>
							</div>
							<script src='https://rtcdn.cincopa.com/meta_json.aspx?ver=v2&fid=${app.templates.default+'@'+fid}&id=cincopa_${fid}' type='text/javascript'></script>
							<script src='https://rtcdn.cincopa.com/libasync.js' type='text/javascript'></script>`;
		$('.channel').html(newEmbedCode);



	},
	getThumbnailUrl:function(data, size){
		var defaultSize = 3;

		size = size || defaultSize;
		var thumbnail = '';
		var versions = null;
		if(data.cover && data.cover.versions){ /* hero image thumbnail for channel */
			versions = data.cover.versions;
		}else if(data.versions){
			versions = data.versions;
		}
		if(versions){
			if(size === 1 && versions['jpg_100x75'] && versions['jpg_100x75'].url){
				thumbnail = versions['jpg_100x75'].url;
			} else if(size === 2 && versions['jpg_200x150'] && versions['jpg_200x150'].url){
				thumbnail = versions['jpg_200x150'].url;
			} else if(size === 3 && versions['jpg_600x450'] && versions['jpg_600x450'].url){
				thumbnail = versions['jpg_600x450'].url;
			} else if (size === 4 && versions['jpg_1200x900'] && versions['jpg_1200x900'].url){
				thumbnail = versions['jpg_1200x900'].url;
			} else if (size === 5 && versions['jpg_sb_100x75'] && versions['jpg_sb_100x75'].url){
				thumbnail = versions['jpg_sb_100x75'].url;
			} else if (size === 6 && versions['jpg_sb_200x150'] && versions['jpg_sb_200x150'].url){
				thumbnail = versions['jpg_sb_200x150'].url;
			} else {
				thumbnail = versions['jpg_600x450'] ? versions['jpg_600x450'].url : "";
			}
		}
		
		
		if(!thumbnail){
			thumbnail = data.cover.url ||  data.thumbnail.url || '';
		}				
		return thumbnail;
	},
	drawChannels:function(galleryId,galleries){
		app.users = app.getPairdUsers();

		app.channel_user = app.users[galleryId];

		$('#main .content-title').html(app.users[galleryId].vendor_name);
		var htm ='';
		htm = `<div class="channel-list"><div class="channel-list__info">
		<div class="channel-list__title"><h3>${(typeof app.users[galleryId].name == 'undefined' ? '': app.users[galleryId].name )}</h3></div>
		<div class="channel-list__descr"><p>${(typeof app.users[galleryId].vendor_description == 'undefined' ? '': app.users[galleryId].vendor_description )}</p></div>
		</div>
		<div class='channel-list__lastView' data-bottom="next" data-top="next">
		`
		var lastSeenVideos = app.getLastSeen();


		if(lastSeenVideos){
			htm += app.generateLastView(lastSeenVideos);
		}

		htm += `</div>
		<div class="channels-list__items" 
		data-top="prev"
		data-bottom="prev"
		>
		<h3>Assets</h3><div class="channels-lists scroll-area">`
		var index = 0;
		var objectlength = Object.keys(galleries).length;
		$.each(galleries,function(i,el){
			
			htm += '<div class="channels-list__item '+(el.status != 'active' ? 'channels-list__item--expired':'')+'"\
			 data-channel_fid="'+el.gallery_fid+'" \
			 data-left="'+(index == 0? '.channels-list__item:last': 'prev') +'"\
			 data-top=".channel-list__lastView--item:first"\
			 data-right="'+(index == objectlength - 1? '.channels-list__item:first' : 'next') +'"\
			 data-bottom="scrolldown"\
			 data-index="'+i+'" data-channel_id="'+el.uuid+'"><img src="https://www.cincopa.com/media-platform/api/thumb.aspx?size=large&fid='+el.gallery_fid+'">\
			<div class="channels-list__info"><div class="channels-list__itemname"><h3>'+el.name+'</h3></div>\
			<div class="channels-list__itemdescr"><p>'+el.description+'</p></div></div>\
			'+(el.status != 'active' ? '<div class="channels-list__expired">'+el.status+'</div>':'')+'<!--<i class="channels-list__remove zmdi zmdi-delete"></i>--></div>';
			index++;
		});
		htm += '</div></div></div>'
		if(htm == ''){
			htm = '<div class="channels-list__empty">\
						<p class="channels-list__emptyText">You have not paird channels</p>\
						<a class="button channels-list__pair">pair</a>\
					</div>';
		}
		$('#main .channels-list').html(htm);
		if($('.channel-list__lastView--item').length > 0){
			$('.channel-list__lastView--item').first().addClass('selected');
		}else if($('.channels-list__item').length > 0 && app.isAndroidTV){
			$('.channels-list__item').first().addClass('selected');
		}


    },
    generateLastView:function(lastSeenVideos){
		// if(app.current_chunnel_id != lastSeenVideos.channel_id ){
		// 	return;
		// }

		var htm = '<h3 >Last Viewed</h3><div class="channel-list__lastView--items scroll-area">';
		var index = 0;
		var objectlength = Object.keys(lastSeenVideos).length;
		$.each(lastSeenVideos, function(key,lastSeen){	
			if(app.current_chunnel_id != lastSeen.channel_id){
				return true;
			}
			var users = localStorage.getItem('users');
			var uid = '';
			var selected = '';
			var progressBars = '';
			users = JSON.parse(users);
			$.each(users,(key) => {
				uid = users[key].uid;
			})
			var d = app.inBetween(document.cookie, "cphmps_" + uid + "_" + lastSeen.rid + "=", ";");
			if(d){
				d = JSON.parse(atob(d));
				progressBars = app.createProgressBars(d.hmrange,lastSeen.duration);
			}
			if(lastSeen.channel_fid == app.lastSelected){
				selected = 'selected';
			}

			htm += '<div class="channel-list__lastView--item '+selected +' "\
			data-lastpos="'+ (d ? d.lastpos: '')+'"\
			data-top="scrollup"\
			data-left='+(index >  0? 'prev': '.channel-list__lastView--item:last')+' \
			data-right="'+(index == objectlength-1? '.channel-list__lastView--item:first' : 'next')+'"\
			data-bottom=".channels-list__item:first"\
			data-index="'+key+'" data-id="'+lastSeen.channel_fid+'" data-rid="'+lastSeen.rid+'">\
                        <div class="lastView-thumbnail">\
                        <img src="'+lastSeen.thumbnail+'">\
						'+(progressBars)+'</div>\
                        <div class="lastView__info">\
                        <div class="lastView-name"><h3>'+lastSeen.title+'</h3></div>\
                        <div class="lastView-descr"><p>'+lastSeen.descr+'</p></div>\
                        </div>\
                        </div>';
			index++

		});
        htm += '</div>';
        return htm;
    },
	setHeaderTitle: function (big,small) {
		big = big || 'CincopaTV';
		small = small || ''
		$('.page-title__big').text(big );
		if(small){
			$('.page-title__small ').text(small).addClass('page-title__small--visible');			
		}else{
			$('.page-title__small ').removeClass('page-title__small--visible');
		}
	},

	showLoader: function () {
		$(".mainloader").show();
	},

	hideLoader: function () {
		$(".mainloader").hide();
	},

	getFormattedDate: function (isoStr) {
		var date = new Date(isoStr);

		var month = date.getMonth() + 1;
		var day = date.getDate();
		var hour = date.getHours();
		var min = date.getMinutes();
		var sec = date.getSeconds();

		month = (month < 10 ? "0" : "") + month;
		day = (day < 10 ? "0" : "") + day;
		hour = (hour < 10 ? "0" : "") + hour;
		min = (min < 10 ? "0" : "") + min;
		sec = (sec < 10 ? "0" : "") + sec;

		var str = date.getFullYear() + "-" + month + "-" + day + " " + hour + ":" + min + ":" + sec;
		return str;
	},
	timeFormated: function (isoStr) {

		var msPerMinute = 60 * 1000;
		var msPerHour = msPerMinute * 60;
		var msPerDay = msPerHour * 24;
		var msPerMonth = msPerDay * 30;
		var msPerYear = msPerDay * 365;
		var previous = new Date(isoStr);
		var current = new Date();
		var elapsed = current - previous;

		if (elapsed < msPerMinute) {
			return ' Now';
		}

		else if (elapsed < msPerHour) {
			return Math.round(elapsed / msPerMinute) + ' minutes ago';
		}

		else if (elapsed < msPerDay) {
			return Math.round(elapsed / msPerHour) + ' hours ago';
		}

		else if (elapsed < msPerMonth) {
			return Math.round(elapsed / msPerDay) + ' days ago';
		}

		else if (elapsed < msPerYear) {
			return Math.round(elapsed / msPerMonth) + ' months ago';
		}

		else {
			return Math.round(elapsed / msPerYear) + ' years ago';
		}
	},
	getTypeFromMime: function (mime) {
		if (!mime) return "unknown";
		if (mime.indexOf("image") > -1) {
			return "image";
		} else if (mime.indexOf("video") > -1) {
			return "video";
		} else if (mime.indexOf("audio") > -1) {
			return "audio";
		} else {
			return "unknown";
		}

	},
	isScrolledIntoView: function (elem) {
		var pos = elem.offset(),
			wX = $(window).scrollLeft(),wY = $(window).scrollTop(),
			wH = $(window).height(),wW = $(window).width(),
			oH = $(elem).outerHeight(),oW = $(elem).outerWidth();
		if (((pos.left <= wX && pos.left + oW > wX) ||
			(pos.left >= wX && pos.left <= wX + wW)) &&
			((pos.top <= wY && pos.top + oH > wY) ||
				(pos.top >= wY && pos.top <= wY + wH))) {
			return true;
		}
		else {
			return false;
		}

	},
	cp_hmsToSecondsOnly: function (str) {
		if (!str)
			return "";
	
		var p = str.split(':'),
			s = 0, m = 1;
	
		while (p.length > 0) {
			s += m * parseInt(p.pop(), 10);
			m *= 60;
		}
	
		return s + (str.indexOf(".") > -1 ? 1 : 0);
	},

	createProgressBars: function (str, duration) {
		var parts = str.split(",")
		var html = "<div class='video-progress-bar-container'>";
		for (var i = 0; i < parts.length; i++) {
			var seconds = parts[i]
			if (parts[i].indexOf(":") > -1) {
				seconds = parts[i].split(":")[0]
			}
			var startSecond = parseInt(seconds.split("-")[0]);
			var endSecond = parseInt(seconds.split("-")[1] || startSecond) + 1;
	
			var width = (endSecond - startSecond) * 100 / duration;
			var left = startSecond / duration * 100;
	
			html += '<div class="video-progress-bar" style="left:' + left + '%;width:' + width + '%;"> </div>';
		}
		html += '</div>';
		return html;
	},

	inBetween: function (str, start, end) {
		var i = str.indexOf(start);
		if (i == -1)
			return null;
	
		var x = str.indexOf(end, i + start.length);
		if (x == -1 || (end == null || end == ""))
			return str.substr(i + start.length);
	
		return str.substr(i + start.length, x - i - start.length);
	},
};
app.initialize();