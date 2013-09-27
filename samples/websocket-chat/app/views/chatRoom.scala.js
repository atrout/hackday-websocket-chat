@(username: String)(implicit r: RequestHeader)

$(function() {

    var WS = window['MozWebSocket'] ? MozWebSocket : WebSocket
    var chatSocket = new WS("@routes.Application.chat(username).webSocketURL()")
    jQuery.event.props.push('dataTransfer')

    var sendMessage = function() {
        chatSocket.send(JSON.stringify(
            {   kind: "talk",
                text: $("#talk").val()
            }
        ))
        $("#talk").val('')
    }

    var sendMoveMessage = function(position) {
        chatSocket.send(JSON.stringify(
            {   kind: "talk",
                text: "has moved the black square" }
        ))

        chatSocket.send(JSON.stringify(
            {   kind: "move",
                position: position
            }
        ))
    }

    var receiveEvent = function(event) {
        var data = JSON.parse(event.data)
        console.info(data);

        // Handle errors
        if(data.error) {
            chatSocket.close()
            $("#onError span").text(data.error)
            $("#onError").show()
            return
        } else {
            $("#onChat").show()
            $("#onCollab").show()
        }

        if (data.kind === "move") {
            moveElt($(".square"), JSON.parse(data.message));
        } else {
            // Create the message element
            var el = $('<div class="message"><span></span><p></p></div>')
            $("span", el).text(data.user)
            $("p", el).text(data.message)
            $(el).addClass(data.kind)
            if(data.user == '@username') $(el).addClass('me')
            $('#messages').append(el)

            // Update the members list
            $("#members").html('')
            $(data.members).each(function() {
                var li = document.createElement('li');
                li.textContent = this;
                $("#members").append(li);
            })
        }
        
    }

    var handleReturnKey = function(e) {
        if(e.charCode == 13 || e.keyCode == 13) {
            e.preventDefault()
            sendMessage()
        }
    }

    $(".square").on("dragstart", function(event) {
        console.info("drag start! ", $(event.target).offset())
        $(event.target).css("opacity", '0.4')
    });

    $(".square").on("dragend", function(event) {
        event.preventDefault()
        moveElt($(event.target), { top: event.originalEvent.clientY, left: event.originalEvent.clientX })
        $(event.target).css("opacity", '1.0')
        sendMoveMessage({ top: event.originalEvent.clientY, left: event.originalEvent.clientX })
        return false;
    });

    var moveElt = function(elt, position) {
        console.info("move ", position);
        elt.offset(position);
    }

    $("#onCollab").on("dragover", function(event) {
        event.preventDefault()
        console.info("over the target!")
    });

    $("#onCollab").on("drop", function(event) {
        event.preventDefault()
        console.info("dropped. ", event);
    });

    

    $("#talk").keypress(handleReturnKey)

    chatSocket.onmessage = receiveEvent

})