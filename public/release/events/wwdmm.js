var playerWasReconnected,imageLoaded=function(a,b){a.find("img").first().on("load",function(){b()}).each(function(){this.complete&&$(this).load()})};$(".body").addClass("wwdmm");var gameEvents=function(a,b){switch(a){case"game:start":break;case"player:reconnected":playerWasReconnected=!0;break;case"meme:create":var c=0;updateGameContent(b,function(){imageLoaded($("#meme-slider"),function(){$("#meme-slider").glide({type:"carousel",autoplay:!1,autoheight:!0,afterTransition:function(a){c=a.index-1,$("#image-index").val(c)}})})}),$(".meme-text").keyup(function(){shrinkToFill(this,340,46)}),$(".meme-text").keypress(function(a){13==a.keyCode&&a.preventDefault()});break;case"meme:received":$("#meme-create").fadeOut(function(){$("#meme-created").fadeIn()});break;case"meme:voting":var c=0;updateGameContent(b,function(){$("#meme-slider").glide({type:"carousel",autoplay:!1,afterTransition:function(a){c=a.index-1}}),$.each($(".meme-text"),function(a,b){shrinkToFill(b,340,46)})}),$("#btn-vote").click(function(a){socket.emit("meme:vote",emitData(c)),$(a.currentTarget).val("voted!").attr("disabled",!0).css({opacity:"0.3"})}),$(".btn-like").click(function(a){socket.emit("meme:like",emitData(c)),$(a.currentTarget).attr("disabled",!0).css("opacity","0.3"),TweenLite.to($(a.currentTarget),.5,{scale:.7,ease:Bounce.easeOut})})}};