
// app variables

var loginName;
var loginPass;
// database refrences
var db_ref;
var messages_ref;
var current_user;
var am_online;
var user_ref;
var connected_users_count=0;
var last_message_ref;
var messages_loaded = false;
//var FIREBASE_ADDR = "https://sololearnfirebasechat-5bb04.firebaseio.com";
var new_user_flag;
// button refrences
var btn_new_user;
var btn_login;
var btn_logout;
var btn_new_post;

var btn_update_post;
var btn_update_cancel;
var global_msg;


var MESSAGES_TO_LOAD = 50;

function init() {
    try {
        
    // Toastr options
    toastr.options = {
      "closeButton": false,
      "debug": false,
      "newestOnTop": false,
      "progressBar": false,
      "positionClass": "toast-top-left",
      "preventDuplicates": false,
      "onclick": null,
      "showDuration": "300",
      "hideDuration": "1000",
      "timeOut": "5000",
      "extendedTimeOut": "1000",
      "showEasing": "swing",
      "hideEasing": "linear",
      "showMethod": "fadeIn",
      "hideMethod": "fadeOut"
    }

            var notifyMe = function(message) {
              // Let's check if the browser supports notifications
              if (!("Notification" in window)) {
                // alert("This browser does not support desktop notification");
                
                if($('#chkbox_notify_vibrate').is(':checked')){
                    if ("vibrate" in navigator) {
                    // vibration API supported
                    navigator.vibrate(1000);
                }
                }
              }
              // Let's check whether notification permissions have already been granted
              else if (Notification.permission === "granted") {
                // If it's okay let's create a notification
                var notification = new Notification(message);
              }
              // Otherwise, we need to ask the user for permission
              else if (Notification.permission !== 'denied') {
                Notification.requestPermission(function (permission) {
                  // If the user accepts, let's create a notification
                  if (permission === "granted") {
                    var notification = new Notification(message);
                  }
                });
              }
          // At last, if the user has denied notifications, and you 
          // want to be respectful there is no need to bother them any more.
        }

     var textToHtml = function(text) {
        text = escapeHtml(text);
        text = text.replace(/\n/g, '<br>');
        
        text = text.replace(
            /([^\\]|^)\[url:([^\]]+)\]\(([^)]+)\)/g,
            (_, smb, name, url) => smb + '<a href="' + url + '">' + name + '</a>'
        );
        
        text = text.replace(/([^\\]|^)\*\*(.+?)\*\*/g, (_, smb, content) => smb + '<b>' + content + '</b>');
        text = text.replace(/([^\\]|^)__(.+?)__/g, (_, smb, content) => smb + '<i>' + content + '</i>');
        
        text = text.replace(/\\(.)/g, (_, character) => character);
        
        return text;
    }
    
     var escapeHtml = function(text) {
      var map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      };
    
      return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }

    var swap_visible = function(elem_visible, elem_hide){
        document.getElementById(elem_visible).style.display = 'block';
        document.getElementById(elem_hide).style.display = 'none';
                    
    }
        var tag;

        var timeToDateString = function(time, sep = " - ") {
            var date = new Date(time);
            var hours = ((date.getHours() < 10) ? '0' : '') + date.getHours();
            var minutes = ((date.getMinutes() < 10) ? '0' : '') + date.getMinutes();
            var seconds = ((date.getSeconds() < 10) ? '0' : '') + date.getSeconds();

            var dateString = hours + ":" + minutes + ":" + seconds + sep + date.getDate() + "/" + (date.getMonth() + 1) + "/" + (date.getYear() + 1900);
            return dateString;
        }
        tag = document.getElementById("name_tag");
        if (!tag)throw new Error();
        
        
        var initFirebase = function() {
            /*
            initialize the firebase service
            */

            // force web sockets to prevent XMLHttpRequest warning    
            firebase.database.INTERNAL.forceWebSockets();
            // connect to Firebase
            try {
                
            if(new_user_flag){
               firebase.auth().createUserWithEmailAndPassword(loginName+"@nomail.com", loginPass ).catch(function(error) {
                  // Handle Errors here.
                  var errorCode = error.code;
                  var errorMessage = error.message;
                  alert("Error Creating new User: " + errorMessage)
                  // ...
                });
            }
            else{
                firebase.auth().signInWithEmailAndPassword(loginName+"@nomail.com", loginPass).catch(function(error) {
                  // Handle Errors here.
                  var errorCode = error.code;
                  var errorMessage = error.message;
                  alert("Error Login in: " + errorMessage)
                  // ...
                });
            }
                
                firebase.auth().onAuthStateChanged(function(user) {
                      if (user) {
                        current_user = user;
                        db_ref.ref("user_list").child(user.uid).set({
                            username:loginName,
                            lastOnline:firebase.database.ServerValue.TIMESTAMP
                        });
                        chat(loginName, loginPass);
                      } else {
                        // No user is signed in.
                        //logout();
                      }
                      return;
                    });
                
                
                db_ref = firebase.database();
                
                messages_ref = db_ref.ref("chat_messages");
                am_online = firebase.database().ref(".info/connected");
                user_ref = firebase.database().ref('/connected/'+loginName);

                // create listener when new user is logged in
                am_online.on('value', function(snapshot) {
                    if (snapshot.val()) {
                        user_ref.onDisconnect().remove();
                        user_ref.set(firebase.database.ServerValue.TIMESTAMP);
                    }
                });


                // this will get fired on inital load as well as when ever there is a change in the data
                messages_ref.orderByChild("time").limitToLast(MESSAGES_TO_LOAD).on("value", snapLoadMessages, onError);
                db_ref.ref("connected").on("value", snapLoadUsers, onError);
                // messages_ref.on("child_added", snapLoad, onError);
            }
            catch (err) {
                alert(err);
            }
        }
        
        
        // connected users dialog box
        $('#table_connected_users_container').dialog({
        modal:true, //Not necessary but dims the page background
              autoOpen : false,
            // height:380,
            'id' : 'table_connected_users_container',
            open : function() {
            //$(this).html('');
        },
            buttons : [
        {
        text:'Close',
            'class' : 'dialog_new',
            click : function() {
            $('#table_connected_users_container').dialog('close');
        }
        }
                      ]
        }
        );
        
        $('#about_dialog').dialog({
        modal:true, //Not necessary but dims the page background
              autoOpen : false,
            // height:380,
            'id' : 'about_dialog',
            open : function() {
            //$(this).html('');
        },
            buttons : [
        {
        text:'Close',
            'class' : 'dialog_new',
            click : function() {
            $('#about_dialog').dialog('close');
        }
        }
                      ]
        }
        );
        
        $(document).ready(function() {
            // connected users button click handler
            $('#show_connected').click(function() {
                $('#table_connected_users_container').dialog('open');
            });
            // aboout window click handler
                        $('.about').click(function() {
                $('#about_dialog').dialog('open');
            });
            
        });

    
        var snapLoadUsers = function(snapshot) {
            var usr_list = [];
            snapshot.forEach(function(child) {
                usr_list.push({username: "- "+child.key+" -", time: child.val()});
            });

            refreshConnectedUsers(usr_list);
        }
        
        var snapLoadMessages = function(snapshot) {
            list = [];
            snapshot.forEach(child => {
                list.push({
                    author: textToHtml(child.val().author),
                    body: textToHtml(child.val().body),
                    time: child.val().time,
                    id: child.key
                })
            });
            
            // refresh the UI  
            refreshUI(list);
        }
        
        var onError = function(err) {
            console.log("Firebase 'on' error: " + err);
        }
        if (tag.innerHTML != "By Burey")throw new Error();
        
        var login = function() {
            loginName = document.getElementById('login_name').value;
            loginName = loginName.trim();
            loginPass = document.getElementById('login_pass').value;
            loginPass = loginPass.trim();
            
            if (loginName.length < 2) {
                toastr.error('Min name length: 2', 'Error!');
                return;
            }
            
            var waitingFunc = function(){
                
            }
            
            initFirebase();
        }
        var logout = function() {
            swap_visible('container_login','container_chat');
            
            messages_loaded = false;
            firebase.auth().signOut().then(function() {
              // Sign-out successful.
                user_ref.remove();
                // db_ref.off();
                messages_ref.off();
                am_online.off();
                user_ref.off();
            }, function(error) {
              // An error happened.
            });
        }
        var chat = function(login, password) { 
        swap_visible('container_chat','container_login');
        document.getElementById('logged_user_name').innerHTML = 'Logged in as: <span id="username">' + login + "</span>";
            // toastr.info('Welcome To the Chat!', 'Hello ' + login + '!!!');
        }
        
        var refreshConnectedUsers = function(list) {
            /*
            load a list of the currently connected users
            */
            var last_connected_index = 0;
            if(list.length > 0)
                var last_connected_time = list[0].time;

            $('#show_connected').text("Connected Users: " + list.length);
            // clean the table except the first row
            $("#table_connected_users").find("tr:gt(0)").remove();
            var tbl = $("#table_connected_users");  // find the table with the id tbl_best_scores
            for (i = list.length - 1; i >= 0; i--) {
                var newRow = "<tr class='user_row'><td class='username'>" + list[i].username + "</td></tr>";
                tbl.append(newRow);
                if(list[i].time > last_connected_time){
                    last_connected_time = list[i].time;
                    last_connected_index = i;
                }
            }
            
        if(list.length > connected_users_count && $('#chkbox_notify').is(':checked')){
               toastr.success(list[last_connected_index].username, 'User Joined the chat:');
                notifyMe(list[last_connected_index].username + "Joined the chat");
            }
    
            connected_users_count = list.length;
        }
        
        var refreshUI = function(list) {
            // clears the messages div and rebuilds it with a new set of data
            // clean all prevoous messages
            $("#message_list").text('');
            var msg_list = $("#message_list");  // find the div with the id
            for (i = list.length - 1; i >= 0; i--) {
                var message = list[i];
            
                var newRow = '<div class="message">';
                newRow += '<div class="message_details">';
                newRow += '<span class="message_author">@{' + message.author + '}</span>';
                
                newRow += '<span class="user_controls" id='+message.id+'>';
                newRow += '<span class="user_controls" name="edit_message">&#x270F;</span>';
                newRow += '<span class="user_controls" name="delete_message">&#x1f5d1;</span>';
                newRow += '</span>';
                
                newRow += ' <span class="message_time"></br>at ' + timeToDateString(message.time) + '</span></div>';
                newRow += '<div class="message_body">' + message.body + "</div>";
                newRow += '<div class="message_actions"><span class="message_reply"></span></div></div>';

                msg_list.append(newRow);
            }
            $(".loader").hide();
            if(list.length == 0)
                return;
            
            if(messages_loaded === true && list[list.length-1].author != loginName){
                messages_loaded = false
                if($('#chkbox_notify').is(':checked')){
                    
                toastr.success(list[list.length-1].body, list[list.length-1].author+' Posted: ');
    
                notifyMe(list[list.length-1].author + ' posted: ' + list[list.length-1].body);
                }
            }
            else
                messages_loaded = true;
                
            last_message_ref = list[list.length-1];
        }
        
        var post = function() {
            if (tag.innerHTML != "By Burey")throw new Error();
            message = document.getElementById('new_message');
            if (message.value.length == 0) {
                toastr.error('Message body cannot be empty', 'Error!');
                return;
            }
            
            var formed_message = {
                author: loginName,
                user_id: current_user.uid,
                body: message.value,
                time: firebase.database.ServerValue.TIMESTAMP
            };
            
            messages_ref.push(formed_message);
            message.value = '';
        }

        btn_new_user = document.getElementById('btn_new_user');
        btn_login = document.getElementById('btn_login');
        btn_logout = document.getElementById('btn_logout');
        btn_new_post = document.getElementById('btn_new_post');
        
        btn_update_post = document.getElementById('btn_update_post');
        btn_update_cancel = document.getElementById('btn_update_cancel');


        btn_new_user.onclick = function(){ new_user_flag = true; login();}
        btn_login.onclick = function(){new_user_flag = false; login();}
        btn_logout.onclick = logout;
        btn_new_post.onclick = post;
        btn_update_post.onclick = function(){
            messages_ref.child(global_msg.msgId).update({body: $("#new_message").val()});
            $("#new_message").val("");
            swap_visible('new_post_controls', 'update_post_controls');
        }
        btn_update_cancel.onclick = function(){
            $("#new_message").val("");
            global_msg = null;
            swap_visible('new_post_controls', 'update_post_controls');
        }
        
        
    $(document).ready(function(){
        
        $("#chk_show_password").on('click',function(){
            if($('#chk_show_password').is(':checked')){
                $('#login_pass').attr('type', 'text');
            }
            else{
                $('#login_pass').attr('type', 'password');
            }
        });
        
            $(".emoji_table").on('click',function(){
                var txt = $.trim($(this).text());
                var box = $("#new_message");
                if(txt==="URL")
                    box.val(box.val() + '[url:LinkName](http://address)');
                else
                    box.val(box.val() + txt);
            });
            
            
            $(document).on('click','.user_controls',function(event){
                event.stopImmediatePropagation();
                var id = $(this).parent().attr("id");
                var name = $(this).attr("name");
                var message_author = $(this).parent().parent().find('.message_author').text();
                var message_body = $(this).parent().parent().parent().find('.message_body').text();

                alert(message_body)
                global_msg = {
                    msgId:id,
                    author:message_author,
                    body:message_body
                };
                $("#new_message").val(message_body);
                
                if(name === 'edit_message'){
                    // switch message controls to update
                    swap_visible('update_post_controls', 'new_post_controls');
                }
                else if(name === 'delete_message'){
                    
                    if(confirm("Delete this message?")){
                        messages_ref.child(id).remove();
                    }
                    $("#new_message").val("");
                }
            });
         });
         
        
    }
    catch (err) {
        alert("Error occured on initiating firebase chat");
    }
}
