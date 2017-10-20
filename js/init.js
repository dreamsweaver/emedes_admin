var app = { 
    // Application Constructor 
    initialize: function() { 
        this.bindEvents(); 
    }, 
    // Bind Event Listeners 
    // 
    // Bind any events that are required on startup. Common events are: 
    // 'load', 'deviceready', 'offline', and 'online'. 
    bindEvents: function() { 
        document.addEventListener('deviceready', this.onDeviceReady, false); 
    }, 
    // deviceready Event Handler 
    // 
    // The scope of 'this' is the event. In order to call the 'receivedEvent' 
    // function, we must explicity call 'app.receivedEvent(...);' 
    onDeviceReady: function() { 
        app.receivedEvent('deviceready'); 
    }, 
    // Update DOM on a Received Event 
    receivedEvent: function(id) { 
        var parentElement = document.getElementById(id);  
		
		var emedes_app = localStorage.getItem("emedes_app");
		
		if( emedes_app !== null ){
			console.log('Received Event: ' + id); 
			var pushNotification = window.plugins.pushNotification; 
			if (device.platform == 'android' || device.platform == 'Android') { 
				//alert("Register called"); 
				//tu Project ID aca!! 
				pushNotification.register(this.successHandler, this.errorHandler,{"senderID":"pushnotifications-182202","ecb":"app.onNotificationGCM"}); 
			} 
			else { 
				//alert("Register called"); 
				pushNotification.register(this.successHandler,this.errorHandler,{"badge":"true","sound":"true","alert":"true","ecb":"app.onNotificationAPN"}); 
			}
		}
    }, 
    // result contains any message sent from the plugin call 
    successHandler: function(result) { 
        alert('Callback Success! Result = '+result) 
    }, 
    errorHandler:function(error) { 
        alert(error); 
    }, 
    onNotificationGCM: function(e) { 
        switch( e.event ){ 
            case 'registered': 
                if ( e.regid.length > 0 ){ 
                    console.log("Regid " + e.regid); 
                    //alert('registration id = '+e.regid); 
                    //Cuando se registre le pasamos el regid al input 
					localStorage.setItem("emedes_app", e.regid);
                } 
            break; 

            case 'message': 
              // NOTIFICACION!!! 
              alert('message = '+e.message+' msgcnt = '+e.msgcnt); 
            break; 

            case 'error': 
              alert('GCM error = '+e.msg); 
            break; 

            default: 
              alert('An unknown GCM event has occurred'); 
              break; 
        } 
    }, 
    onNotificationAPN: function(event) { 
        var pushNotification = window.plugins.pushNotification; 
        alert("Running in JS - onNotificationAPN - Received a notification! " + event.alert); 
         
        if (event.alert) { 
            navigator.notification.alert(event.alert); 
        } 
        if (event.badge) { 
            pushNotification.setApplicationIconBadgeNumber(this.successHandler, this.errorHandler, event.badge); 
        } 
        if (event.sound) { 
            var snd = new Media(event.sound); 
            snd.play(); 
        } 
    } 
};
app.initialize();
 
//url_base = 'http://emedesappcontroller.dev/';
url_base = 'http://appemedes.audiolabsv.com/';
ajax_url = url_base+'wp-admin/admin-ajax.php';

document.addEventListener("deviceready", onDeviceReady, false);
function onDeviceReady() {
	checkConnection();
	setInterval(function(){checkConnection();},30000);
}

jQuery(document).ready(function(e) {
	
	jQuery('body').delegate('.reload','tap',function(){
		window.location.reload();
	});
	
	if( jQuery('body').hasClass('home') ){
		verify_loggedin_cookie();
		nonce = get_nonce();
		
		jQuery('body').delegate('#sendLogin','tap',function(){
			var pass = jQuery('#pass').val();
			var user = jQuery('#user').val();
			jQuery.ajax({
				type: "POST",
				cache:false,
				url: url_base+'api/auth/generate_auth_cookie/',
				data: {
					nonce : nonce,
					username : user,
					password : pass,
					insecure : "cool"
				},
				beforeSend: function(){
					loading_ajax();
				},
				success: function (data) {
					loading_ajax({estado:false});
					if( data.status == "ok" ){
						localStorage.setItem('wordpress_loggedin_admin', data.cookie);
						localStorage.setItem('app_user_id', data.user.id);
						check_role('administrator');
						set_deviceid(data.user.id);
						window.location.href = 'app.html';
					} else {
						jQuery( "#popupLogin" ).popup( "open" );
					}
				},
				timeout:10000,
				error: function(){
					loading_ajax({estado:false});
					navigator.notification.alert('No hay respuesta del servidor, si haces click en aceptar se volverá a intentar cargar los datos', function(){ window.location.reload() }, 'Servidor no responde','Aceptar');
					//navigator.notification.beep(2);
					//navigator.notification.vibrate(2);
				}
			});
			return false;
		});
	}
	
	if( jQuery('#login-page').length ){
		jQuery('#login-page').removeClass('ui-page-theme-a');
	}
	
	if( jQuery('.timepicker').length ){
		jQuery('.timepicker').timepicker({
			template: false,
			showInputs: false,
			minuteStep: 15,
			showMeridian: false,
			defaultTime: '08:30'
		});
	}
	
	if( jQuery('body').hasClass('app') ){
		check_role('administrator');
		verify_loggedout_cookie();
		
		jQuery.ajax({
			type: "POST",
			url: ajax_url,
			cache:false,
			data: {
				user : jQuery.cookie('app_user_id'),
				action: "get_all_visitis"
			},
			beforeSend: function(){
				loading_ajax();
			},
			success: function (data) {
				var tabla = '';
				dat_ = jQuery.parseJSON(data);
				//console.log(dat_);
				if( dat_.estados ){
					for(i = 0; i < dat_.estados.length; i++){
						
						var fecha = dat_.estados[i].date.split('-');
						var date = new Date();
						var dia = date.getDate();
						var mes = date.getMonth();
						var anio = date.getFullYear();
						
						var hoy = new Date(anio+'/'+mes+'/'+dia);
						var day = new Date(fecha[0]+'/'+(parseInt(fecha[1])-1)+'/'+fecha[2]);
						
						//console.log(day.getTime() < hoy.getTime());
						//console.log(day.getTime() > hoy.getTime());
						//console.log(day.getTime() === hoy.getTime());
						//console.log(dat_.estados[i].state);
						
						if( day.getTime() < hoy.getTime() && dat_.estados[i].state !== 'completado' ){
							botones = '<a href="reprogramar.html?id='+dat_.estados[i].id+'" class="btn btn-default"><i class="fa fa-clock-o"></i></a><a href="#popupDialogEstrellaO" data-rel="popup" data-position-to="window" data-transition="pop" class="btn btn-default"><i class="fa fa-star-o"></i></a><a href="#popupEliminar" data-id="'+dat_.estados[i].id+'" data-rel="popup" data-position-to="window" data-transition="pop" class="btn btn-danger del-visita"><i class="fa fa-times"></i></a>';
						} else if( day.getTime() <= hoy.getTime() && dat_.estados[i].state === 'completado' ){
							botones = '<a href="" class="btn btn-default disabled"><i class="fa fa-clock-o"></i></a><a href="#popupDialogEstrella" data-rel="popup" data-position-to="window" data-transition="pop" data-id="'+dat_.estados[i].id+'" class="btn btn-default verfirma"><i class="fa fa-star"></i></a><a href="#popupEliminar" data-rel="popup" data-position-to="window" data-transition="pop" data-id="'+dat_.estados[i].id+'" class="btn btn-danger del-visita"><i class="fa fa-times"></i></a>';
						} else if( day.getTime() === hoy.getTime() && dat_.estados[i].state !== 'completado' ){
							botones = '<a href="reprogramar.html?id='+dat_.estados[i].id+'" class="btn btn-default"><i class="fa fa-clock-o"></i></a><a href="#popupDialogRojo" data-rel="popup" data-position-to="window" data-transition="pop" class="btn btn-default "><i class="fa fa-bell curso"></i></a><a href="#popupEliminar" data-id="'+dat_.estados[i].id+'" data-rel="popup" data-position-to="window" data-transition="pop" class="btn btn-danger del-visita"><i class="fa fa-times"></i></a>';
						} else if( day.getTime() > hoy.getTime() && dat_.estados[i].state !== 'completado' ){
							botones = '<a href="reprogramar.html?id='+dat_.estados[i].id+'" class="btn btn-default"><i class="fa fa-clock-o"></i></a><a href="#popupDialogVerde" data-rel="popup" data-position-to="window" data-transition="pop" class="btn btn-default"><i class="fa fa-bell proxima"></i></a><a href="#popupEliminar" data-id="'+dat_.estados[i].id+'" data-rel="popup" data-position-to="window" data-transition="pop" class="btn btn-danger del-visita"><i class="fa fa-times"></i></a>';
						}
						
						tabla += '<tr><td class="col-xs-8 col-sm-8"><p>'+dat_.estados[i].title+' <span>[ '+dat_.estados[i].empleado+' ]</span></p><span>'+dat_.estados[i].date+' '+dat_.estados[i].start+'</span></td><td class="col-xs-4 col-sm-4">'+botones+'</td></tr>';
					}
					
					jQuery('#tabla-estados tbody').html(tabla);
				}
				loading_ajax({estado:false});
			}
		});
		
		jQuery.ajax({
			type: "POST",
			url: ajax_url,
			cache:false,
			data: {
				user : jQuery.cookie('app_user_id'),
				action: "get_all_costumers"
			},
			beforeSend: function(){
				loading_ajax();
			},
			success: function (data) {
				var tabla = '';
				var option = '';
				dat_ = jQuery.parseJSON(data);
				if( dat_.clientes ){
					for(i = 0; i < dat_.clientes.length; i++){
						
						tabla += '<tr><td class="col-xs-9 col-sm-9"><p>'+dat_.clientes[i].tipo+' '+dat_.clientes[i].empresa+' <span>[ '+dat_.clientes[i].empleado+' ]</span></p><span>Encargado: '+dat_.clientes[i].nombre+'</span></td><td class="col-xs-3 col-sm-3"><a href="editar-cliente.html?id='+dat_.clientes[i].id+'" class="btn btn-default"><i class="fa fa-edit"></i></a></a><a href="#popupEliminarCliente"  data-rel="popup" data-position-to="window" data-transition="pop" data-id="'+dat_.clientes[i].id+'" class="btn btn-danger del-cliente"><i class="fa fa-times"></i></a></td></tr>';
						
						option += '<option value="'+dat_.clientes[i].empresa+'">'+dat_.clientes[i].empresa+'</option>';
					}
					
					jQuery('#mis-clientes tbody').html(tabla);
					jQuery('#cliente-programar').html(option);
				}
				
				loading_ajax({estado:false});
			}
		});
		
		jQuery.ajax({
			type: "POST",
			url: ajax_url,
			cache:false,
			data: {
				action: "get_all_users"
			},
			beforeSend: function(){
				loading_ajax();
			},
			success: function (data) {
				var tabla = '';
				var option = '';
				dat_ = jQuery.parseJSON(data);
				if( dat_.usuarios ){
					for(i = 0; i < dat_.usuarios.length; i++){
						option += '<option value="'+dat_.usuarios[i].id+'">'+dat_.usuarios[i].nombre+'</option>';
					}
					
					jQuery('#empleado-programar').html(option);
					jQuery('#empleado-cliente').html(option);
				}
				loading_ajax({estado:false});
			}
		});
	}
	
	jQuery('body').delegate('.verfirma','tap', function(){
		var element = jQuery(this);
		var id = element.data('id');
		var url = jQuery('#popupDialogEstrella .boton-editar').attr('href');
		var parts = url.split('=');
		parts[1] = id;
		var new_url = parts.join('=');
		jQuery('#popupDialogEstrella .boton-editar').attr('href',new_url);
	});
	
	jQuery('body').delegate('.del-cliente','tap', function(){
		var element = jQuery(this);
		var id = element.data('id');
		jQuery('#popupEliminarCliente .boton-del-cliente').data('id',id);
	});
	
	jQuery('body').delegate('.del-visita','tap', function(){
		var element = jQuery(this);
		var id = element.data('id');
		jQuery('#popupEliminar .boton-del-visita').data('id',id);
	});
	
	jQuery('body').delegate('.del-usuario','tap', function(){
		var element = jQuery(this);
		var id = element.data('id');
		jQuery('#popupEliminarUsuario .boton-del-usuario').data('id',id);
	});
	
	jQuery('body').delegate('.boton-del-visita','tap', function(){
		var element = jQuery(this);
		var id = element.data('id');
		jQuery.ajax({
			type: "POST",
			url: ajax_url,
			data: {
				id:id,
				action: "delete_data"
			},
			beforeSend: function(){
				loading_ajax();
			},
			success: function (data) {
				dat_ = jQuery.parseJSON(data);
				if( dat_.error ){
					jQuery( "#popupDialogError .mensaje" ).html(dat_.msj);
					jQuery( "#popupDialogError" ).popup( "open" );
				} else if(dat_.exito) {
					window.location.href = 'respuestas-forms.html?#respuesta-exito';
				} else {
					//alert("No hay respuesta del servidor");
					navigator.notification.alert('No hay respuesta del servidor', function(){}, 'Error','Aceptar');
					//navigator.notification.vibrate(1000);
				}
				loading_ajax({estado:false});
			}
		});
	});
	
	jQuery('body').delegate('.boton-del-cliente','tap', function(){
		var element = jQuery(this);
		var id = element.data('id');
		jQuery.ajax({
			type: "POST",
			url: ajax_url,
			data: {
				id:id,
				action: "delete_data"
			},
			beforeSend: function(){
				loading_ajax();
			},
			success: function (data) {
				dat_ = jQuery.parseJSON(data);
				if( dat_.error ){
					jQuery( "#popupDialogError .mensaje" ).html(dat_.msj);
					jQuery( "#popupDialogError" ).popup( "open" );
				} else if(dat_.exito) {
					window.location.href = 'respuestas-forms.html?#respuesta-exito';
				} else {
					//alert("No hay respuesta del servidor");
					navigator.notification.alert('No hay respuesta del servidor', function(){}, 'Error','Aceptar');
					//navigator.notification.vibrate(1000);
				}
				loading_ajax({estado:false});
			}
		});
	});
	
	jQuery('body').delegate('.boton-del-usuario','tap', function(){
		var element = jQuery(this);
		var id = element.data('id');
		console.log(id);
		return;
		jQuery.ajax({
			type: "POST",
			url: ajax_url,
			data: {
				id:id,
				action: "remove_user"
			},
			beforeSend: function(){
				loading_ajax();
			},
			success: function (data) {
				dat_ = jQuery.parseJSON(data);
				if( dat_.error ){
					jQuery( "#popupDialogError .mensaje" ).html(dat_.msj);
					jQuery( "#popupDialogError" ).popup( "open" );
				} else if(dat_.exito) {
					window.location.href = 'respuestas-forms.html?#respuesta-exito';
				} else {
					//alert("No hay respuesta del servidor");
					navigator.notification.alert('No hay respuesta del servidor', function(){}, 'Error','Aceptar');
					//navigator.notification.vibrate(1000);
				}
				loading_ajax({estado:false});
			}
		});
	});
	
	jQuery('body').delegate('.programar-send-btn','tap',function(){
		var fecha = jQuery('#cambio-fecha').val();
		var hora = jQuery('#cambio-hora').val();
		var cliente = jQuery('#cliente-programar').val();
		var empleado = jQuery('#empleado-programar').val();
		
		if( !fecha.length || !hora.length || !cliente.length || !empleado.length ){
			alert("Debes rellenar todos los campos");
			return;
		}
		
		jQuery.ajax({
			type: "POST",
			url: ajax_url,
			data: {
				fecha : fecha,
				hora : hora,
				cliente: cliente,
				user : empleado,
				action: "set_visit"
			},
			beforeSend: function(){
				loading_ajax();
			},
			success: function (data) {
				dat_ = jQuery.parseJSON(data);
				if( dat_.error ){
					jQuery( "#popupDialogError2 .mensaje" ).html(dat_.msj);
					jQuery( "#popupDialogError2" ).popup( "open" );
				} else if(dat_.exito) {
					window.location.href = 'respuestas-forms.html?#respuesta-exito';
				} else {
					//alert("No hay respuesta del servidor");
					navigator.notification.alert('No hay respuesta del servidor', function(){}, 'Error','Aceptar');
					//navigator.notification.vibrate(1000);
				}
				loading_ajax({estado:false});
			}
		});
	});
	
	jQuery('body').delegate('.crearusuario-send-btn','tap',function(){
		var nombre = jQuery('#nombre-usuario').val();
		var apellido = jQuery('#apellido-usuario').val();
		var nickname = jQuery('#nickname-usuario').val();
		var email = jQuery('#email-usuario').val();
		var tipo = jQuery('#tipo-usuario').val();
		
		if( !nombre.length || !apellido.length || !nickname.length || !email.length || !tipo.length ){
			alert("Debes rellenar todos los campos");
			return;
		}
		
		jQuery.ajax({
			type: "POST",
			url: ajax_url,
			data: {
				nombre : nombre,
				apellido : apellido,
				nickname: nickname,
				email: email,
				tipo : tipo,
				action: "crear_usuario"
			},
			beforeSend: function(){
				loading_ajax();
			},
			success: function (data) {
				dat_ = jQuery.parseJSON(data);
				if( dat_.error ){
					jQuery( "#popupDialogError .mensaje" ).html(dat_.msj);
					jQuery( "#popupDialogError" ).popup( "open" );
				} else if(dat_.exito) {
					window.location.href = 'respuestas-forms.html?#respuesta-exito';
				} else {
					//alert("No hay respuesta del servidor");
					navigator.notification.alert('No hay respuesta del servidor', function(){}, 'Error','Aceptar');
					//navigator.notification.vibrate(1000);
				}
				loading_ajax({estado:false});
			}
		});
	});
	
	jQuery('body').delegate('.editarusuario-send-btn','tap',function(){
		var nombre = jQuery('#nombre-usuario').val();
		var apellido = jQuery('#apellido-usuario').val();
		var email = jQuery('#email-usuario').val();
		var tipo = jQuery('#tipo-usuario').val();
		var id = get_URL_parameter('id');
		
		if( !nombre.length || !apellido.length || !email.length || !tipo.length ){
			alert("Debes rellenar todos los campos");
			return;
		}
		
		jQuery.ajax({
			type: "POST",
			url: ajax_url,
			data: {
				id : id,
				nombre : nombre,
				apellido : apellido,
				email: email,
				tipo : tipo,
				action: "edit_usuario"
			},
			beforeSend: function(){
				loading_ajax();
			},
			success: function (data) {
				dat_ = jQuery.parseJSON(data);
				if( dat_.error ){
					jQuery( "#popupDialogError .mensaje" ).html(dat_.msj);
					jQuery( "#popupDialogError" ).popup( "open" );
				} else if(dat_.exito) {
					window.location.href = 'respuestas-forms.html?#respuesta-exito';
				} else {
					//alert("No hay respuesta del servidor");
					navigator.notification.alert('No hay respuesta del servidor', function(){}, 'Error','Aceptar');
					//navigator.notification.vibrate(1000);
				}
				loading_ajax({estado:false});
			}
		});
	});
	
	jQuery('body').delegate('.reprogramar-send-btn','tap',function(){
		var id = decodeURI(get_URL_parameter('id'));
		var fecha = jQuery('#cambio-fecha').val();
		var hora = jQuery('#cambio-hora').val();
		var motivo = jQuery('#motivo-cambio').val();
		
		if( !fecha.length || !hora.length || !id.length || !motivo.length ){
			alert("Debes rellenar todos los campos");
			return;
		}
		
		jQuery.ajax({
			type: "POST",
			url: ajax_url,
			data: {
				fecha : fecha,
				hora : hora,
				motivo: motivo,
				id:id,
				user : jQuery.cookie('app_user_id'),
				action: "reset_visit"
			},
			beforeSend: function(){
				loading_ajax();
			},
			success: function (data) {
				dat_ = jQuery.parseJSON(data);
				if( dat_.error ){
					jQuery( "#popupDialogError2 .mensaje" ).html(dat_.msj);
					jQuery( "#popupDialogError2" ).popup( "open" );
				} else if(dat_.exito) {
					window.location.href = 'respuestas-forms.html?#respuesta-exito';
				} else {
					//alert("No hay respuesta del servidor");
					navigator.notification.alert('No hay respuesta del servidor', function(){}, 'Error','Aceptar');
					//navigator.notification.vibrate(1000);
				}
				loading_ajax({estado:false});
			}
		});
	});
	
	jQuery('body').delegate('.edit-send-btn','tap', function(){
		var encargado = jQuery('#nombre-encargado').val();
		var email = jQuery('#email-encargado').val();
		var empleado = jQuery('#empleado-programar').val();
		var id = decodeURI(get_URL_parameter('id'));
		var telefono = jQuery('#telefono-encargado').val();
		var tipo = jQuery('#tipo-cliente').val();
		
		if( !encargado.length || !email.length ){
			alert("Debes rellenar los campos");
			return;
		}
		
		jQuery.ajax({
			type: "POST",
			url: ajax_url,
			data: {
				id:id,
				encargado : encargado,
				email : email,
				empleado : empleado,
				telefono : telefono,
				tipo : tipo,
				action: "edit_costumer"
			},
			beforeSend: function(){
				loading_ajax();
			},
			success: function (data) {
				dat_ = jQuery.parseJSON(data);
				if( dat_.error ){
					jQuery( "#popupDialogError .mensaje" ).html( dat_.msj );
					jQuery( "#popupDialogError" ).popup( "open" );
				} else if(dat_.exito) {
					window.location.href = 'respuestas-forms.html?#respuesta-exito';
				} else {
					//alert("No hay respuesta del servidor");
					navigator.notification.alert('No hay respuesta del servidor', function(){}, 'Error','Aceptar');
					//navigator.notification.vibrate(1000);
				}
				loading_ajax({estado:false});
			}
		});
		return false;
	});
	
	jQuery('body').delegate('.editcliente-send-btn','tap', function(){
		var empresa = jQuery('#empresa-registrar').val();
		var encargado = jQuery('#nombre-encargado').val();
		var email = jQuery('#email-encargado').val();
		var empleado = jQuery('#empleado-cliente').val();
		var telefono = jQuery('#telefono-encargado').val();
		var tipo = jQuery('#tipo-cliente').val();
		
		console.log(empresa);
		console.log(encargado);
		console.log(email);
		console.log(empleado);
		console.log(telefono);
		console.log(tipo);
		
		if( !encargado.length || !email.length || !empresa.length ){
			alert("Debes rellenar los campos");
			return;
		}
		
		jQuery.ajax({
			type: "POST",
			url: ajax_url,
			data: {
				empresa : empresa,
				encargado : encargado,
				email : email,
				empleado : empleado,
				telefono : telefono,
				tipo : tipo,
				action: "add_costumer"
			},
			beforeSend: function(){
				loading_ajax();
			},
			success: function (data) {
				dat_ = jQuery.parseJSON(data);
				if( dat_.error ){
					jQuery( "#popupDialogError .mensaje" ).html( dat_.msj );
					jQuery( "#popupDialogError" ).popup( "open" );
				} else if(dat_.exito) {
					window.location.href = 'respuestas-forms.html?#respuesta-exito';
				} else {
					//alert("No hay respuesta del servidor");
					navigator.notification.alert('No hay respuesta del servidor', function(){}, 'Error','Aceptar');
					//navigator.notification.vibrate(1000);
				}
				loading_ajax({estado:false});
			}
		});
		return false;
	});
	
	jQuery('body').delegate('.cambiopass-send-btn','tap', function(){
		var pass = jQuery('#nuevo-pass').val();
		var id = decodeURI(get_URL_parameter('id'));
		
		if( !pass.length || !id.length ){
			alert("Debes rellenar el campo");
			return;
		}
		
		jQuery.ajax({
			type: "POST",
			url: ajax_url,
			data: {
				user:id,
				password : pass,
				action: "set_password"
			},
			beforeSend: function(){
				loading_ajax();
			},
			success: function (data) {
				dat_ = jQuery.parseJSON(data);
				if( dat_.error ){
					jQuery( "#popupDialogError .mensaje" ).html( dat_.msj );
					jQuery( "#popupDialogError" ).popup( "open" );
				} else if(dat_.exito) {
					window.location.href = 'respuestas-forms.html?#respuesta-exito';
				} else {
					//alert("No hay respuesta del servidor");
					navigator.notification.alert('No hay respuesta del servidor', function(){}, 'Error','Aceptar');
					//navigator.notification.vibrate(1000);
				}
				loading_ajax({estado:false});
			}
		});
		return false;
	});
	
	jQuery('body').delegate('.logout','clic tap',function(){
		loading_ajax();
		localStorage.removeItem('wordpress_loggedin_admin');
		localStorage.removeItem('app_user_id');
		if (!localStorage.getItem('wordpress_loggedin_admin') && !localStorage.getItem('app_user_id')) {
			window.location.href = 'index.html';
		} else {
			localStorage.setItem('wordpress_loggedin_admin', '', { expires: 0, path: '/' });
			localStorage.setItem('app_user_id', 0, { expires: 0, path: '/' });
			window.location.href = 'index.html';
		}
	});
	
	if( jQuery('body').hasClass('edit-cliente') ){
		verify_loggedout_cookie();
		var id = decodeURI(get_URL_parameter('id'));
		jQuery.ajax({
			type: "POST",
			url: ajax_url,
			data: {
				id:id,
				action: "get_direct_costumer_data"
			},
			beforeSend: function(){
				loading_ajax();
			},
			success: function (data) {
				dat_ = jQuery.parseJSON(data);
				if( dat_[0].error ){
					jQuery( "#popupDialogError .mensaje" ).html(data.msj);
					jQuery( "#popupDialogError" ).popup( "open" );
				} else {
					jQuery('#nombre-empresa').html(dat_[0].empresa);
					jQuery('#nombre-encargado').val(dat_[0].encargado);
					jQuery('#email-encargado').val(dat_[0].email);
					jQuery('#telefono-encargado').val(dat_[0].telefono);
					
					jQuery('#tipo-cliente option').each(function() {
						var element = jQuery(this);
						if( dat_[0].tipo == element.attr('value') ){
							element.attr('selected',true);
							jQuery('#tipo-cliente').parent().find('span').text(dat_[0].tipo);
						}
					});
					
					jQuery.ajax({
						type: "POST",
						url: ajax_url,
						data: {
							action: "get_all_users"
						},
						beforeSend: function(){
							loading_ajax();
						},
						success: function (data2) {
							var tabla = '';
							var option = '';
							dat2_ = jQuery.parseJSON(data2);
							for(i = 0; i < dat2_.usuarios.length; i++){
								option += '<option value="'+dat2_.usuarios[i].id+'"';
								if( dat_[0].empleado == dat2_.usuarios[i].id ){
									option += ' selected';
									jQuery('#empleado-programar').parent().find('span').text(dat2_.usuarios[i].nombre);
								}
								option += '>'+dat2_.usuarios[i].nombre+'</option>';
							}
							
							jQuery('#empleado-programar').html(option);
							
							loading_ajax({estado:false});
						}
					});
					
				}
				loading_ajax({estado:false});
			}
		});
	}
	
	if( jQuery('body').hasClass('reprogramacion') ){
		verify_loggedout_cookie();
		var id = decodeURI(get_URL_parameter('id'));
		jQuery.ajax({
			type: "POST",
			url: ajax_url,
			data: {
				id:id,
				action: "get_visit_data"
			},
			beforeSend: function(){
				loading_ajax();
			},
			success: function (data) {
				dat_ = jQuery.parseJSON(data);
				if( dat_[0].error ){
					jQuery( "#popupDialogError .mensaje" ).html(data.msj);
					jQuery( "#popupDialogError" ).popup( "open" );
				} else {
					jQuery('#cambio-fecha').val(dat_[0].fecha);
					jQuery('#cambio-hora').val(dat_[0].hora);
				}
				loading_ajax({estado:false});
			}
		});
	}
	
	if( jQuery('body').hasClass('firma') ){
		verify_loggedout_cookie();
		var id = decodeURI(get_URL_parameter('id'));
		jQuery.ajax({
			type: "POST",
			url: ajax_url,
			data: {
				id:id,
				action: "get_comprobante_data"
			},
			beforeSend: function(){
				loading_ajax();
			},
			success: function (data) {
				dat_ = jQuery.parseJSON(data);
				if( dat_[0].error ){
					jQuery( "#popupDialogError .mensaje" ).html(data.msj);
					jQuery( "#popupDialogError" ).popup( "open" );
				} else {
					jQuery('#fecha_visita').html(dat_[0].fecha);
					jQuery('#hora_visita').html(dat_[0].hora);
					jQuery('#encargado_visita').html(dat_[0].encargado);
					jQuery('#email_visita').html(dat_[0].email);
					jQuery('#comentarios_visita').html(dat_[0].comentarios);
					jQuery('#firma').html('<img src="'+dat_[0].firma+'" width="100%" />');
				}
				loading_ajax({estado:false});
			}
		});
	}
	
	if( jQuery('body').hasClass('usuarios') ){
		verify_loggedout_cookie();
		check_role('administrator');
		
		jQuery.ajax({
			type: "POST",
			url: ajax_url,
			data: {
				action: "get_all_users"
			},
			beforeSend: function(){
				loading_ajax();
			},
			success: function (data) {
				dat_ = jQuery.parseJSON(data);
				if( dat_.error ){
					jQuery( "#popupDialogError .mensaje" ).html(data.msj);
					jQuery( "#popupDialogError" ).popup( "open" );
				} else {
					var tabla = '';
					dat_ = jQuery.parseJSON(data);
					for(i = 0; i < dat_.usuarios.length; i++){
						
						tabla += '<tr><td class="col-xs-6 col-sm-6"><p>'+dat_.usuarios[i].nombre+' </p></td><td class="col-xs-6 col-sm-6"><a href="editar-usuario.html?id='+dat_.usuarios[i].id+'" class="btn btn-default"><i class="fa fa-edit"></i></a><a href="cambio-pass.html?id='+dat_.usuarios[i].id+'&user='+encodeURI(dat_.usuarios[i].nombre)+'" class="btn btn-success del-cliente"><i class="fa fa-asterisk"></i></a><a href="#popupEliminarUsuario"  data-rel="popup" data-position-to="window" data-transition="pop" data-id="'+dat_.usuarios[i].id+'" class="btn btn-danger del-usuario"><i class="fa fa-times"></i></a></td></tr>';
						
					}
					
					jQuery('#tabla-usuarios tbody').html(tabla);
				}
				loading_ajax({estado:false});
			}
		});
	}
	
	if( jQuery('body').hasClass('cambio-pass') ){
		verify_loggedout_cookie();
		check_role('administrator');
		var user = get_URL_parameter('id');
		var nombre = decodeURI( get_URL_parameter('user') );
		jQuery('#usuario').html(nombre);
	}
	
	if( jQuery('body').hasClass('edita-usuario') ){
		verify_loggedout_cookie();
		check_role('administrator');
		var id = decodeURI(get_URL_parameter('id'));
		
		jQuery.ajax({
			type: "POST",
			url: ajax_url,
			data: {
				id:id,
				action: "get_user_data"
			},
			beforeSend: function(){
				loading_ajax();
			},
			success: function (data) {
				dat_ = jQuery.parseJSON(data);
				console.log(dat_);
				if( dat_.error ){
					jQuery( "#popupDialogError .mensaje" ).html(data.msj);
					jQuery( "#popupDialogError" ).popup( "open" );
				} else {
					jQuery("#nombre-usuario").val(dat_.user.nombre);
					jQuery("#apellido-usuario").val(dat_.user.apellido);
					jQuery("#email-usuario").val(dat_.user.email);
					jQuery("#nickname-usuario").val(dat_.user.nickname);
					
					jQuery("#tipo-usuario option").each(function() {
						var element = jQuery(this);
						if( element.val() == dat_.user.role ){
							element.attr('selected','selected');
						}
					});
				}
				loading_ajax({estado:false});
			}
		});
	}
	
});

function get_nonce(){
	jQuery.ajax({
		type: "GET",
		url: url_base+'api/get_nonce/?controller=auth&method=generate_auth_cookie',
		beforeSend: function(){
			loading_ajax();
		},
		success: function (data) {
			loading_ajax({estado:false});
			if( data.status == "ok" ){
				return data.nonce;
			} else {
				return false;
			}
		},
		timeout:10000,
		error: function(){
			loading_ajax({estado:false});
			navigator.notification.alert('No hay respuesta del servidor, si haces click en aceptar se volverá a intentar cargar los datos', function(){ window.location.reload() }, 'Servidor no responde','Aceptar');
			//navigator.notification.beep(1000);
			//navigator.notification.vibrate(2);
		}
	});
}

function verify_loggedin_cookie(){
	if (localStorage.getItem('wordpress_loggedin_admin')) {
		window.location.href = 'app.html';
	}
}

function verify_loggedout_cookie(){
	if (!localStorage.getItem('wordpress_loggedin_admin')) {
		window.location.href = 'index.html';
	}
}

function loading_ajax(options){
	var defaults = {
		'estado' : true
	}
	jQuery.extend(defaults, options);
	
	if(defaults.estado == true){
		jQuery('body').append('<div class="sombra_popup sportive-ajax"><div class="sk-three-bounce"><div class="sk-child sk-bounce1"></div><div class="sk-child sk-bounce2"></div><div class="sk-child sk-bounce3"></div></div></div>');
		jQuery('.sombra_popup').fadeIn(1000);
	} else {
		jQuery('.sombra_popup').fadeOut(800, function(){
			jQuery('.sportive-ajax').remove();
		});
	}
}

function get_URL_parameter(sParam){
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for(i = 0; i < sURLVariables.length; i++){
        var sParameterName = sURLVariables[i].split('=');
        if(sParameterName[0] == sParam){
            return sParameterName[1];
		}
	}
}

function check_role(role){
	user = localStorage.getItem('app_user_id');
	jQuery.ajax({
		type: "POST",
		data: {
			role : role,
			user : user,
			action : 'lockout_app'
		},
		url: ajax_url,
		beforeSend: function(){
			loading_ajax();
		},
		success: function (data) {
			dat_ = jQuery.parseJSON(data);
			loading_ajax({estado:false});
			if( dat_.error == "1" ){
				localStorage.removeItem('wordpress_loggedin_admin');
				localStorage.removeItem('app_user_id');
				window.location.href = 'index.html';
			}
		}
	});
}

function checkConnection() {
    var networkState = navigator.connection.type;

    var states = {};
    states[Connection.UNKNOWN]  = 'Unknown connection';
    states[Connection.ETHERNET] = 'Ethernet connection';
    states[Connection.WIFI]     = 'WiFi connection';
    states[Connection.CELL_2G]  = 'Cell 2G connection';
    states[Connection.CELL_3G]  = 'Cell 3G connection';
    states[Connection.CELL_4G]  = 'Cell 4G connection';
    states[Connection.NONE]     = 'No network connection';
	
	if( states[networkState] === states[Connection.UNKNOWN] || states[networkState] === states[Connection.NONE] ){
		navigator.notification.alert('No hay Conexión a internet o es muy lenta', function(){}, 'Error','Aceptar');
		//navigator.notification.vibrate(1000);
	}
}

function set_deviceid(userid){
	var emedes_app = localStorage.getItem("emedes_app");
	if( emedes_app !== null ){
		jQuery.ajax({
			type: "POST",
			cache:false,
			url: ajax_url,
			data: {
				appid : emedes_app,
				user : userid,
				action : 'set_deviceid',
			},
			beforeSend: function(){
				loading_ajax();
			},
			success: function (data) {
				loading_ajax({estado:false});
				if( data.msj == 'error' ){
					navigator.notification.alert('El dispositivo no puede recibir notificaciones', function(){ }, 'Error de notificaciones','Aceptar');
				}
			},
			timeout:10000,
			error: function(){
				loading_ajax({estado:false});
				navigator.notification.alert('No hay respuesta del servidor, si haces click en aceptar se volverá a intentar cargar los datos', function(){ window.location.reload() }, 'Servidor no responde','Aceptar');
				//navigator.notification.beep(2);
				//navigator.notification.vibrate(2);
			}
		});
	}
}