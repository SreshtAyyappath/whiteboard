package com.sresht.whiteboard;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class DrawController {

    @MessageMapping("/draw/{roomId}")
    @SendTo("/topic/draw/{roomId}")
    public DrawData broadcastDrawing(@DestinationVariable String roomId, DrawData drawData) {
        System.out.println(drawData.toString());
        return drawData; // just echoes back to all subscribers in this room
    }
}
