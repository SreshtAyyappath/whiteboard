package com.sresht.whiteboard;

public class DrawData {

    private String roomId;
    private double x;
    private double y;
    private boolean isNewStroke;

    public DrawData() {
    }

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public double getX() {
        return x;
    }

    public void setX(double x) {
        this.x = x;
    }

    public double getY() {
        return y;
    }

    public void setY(double y) {
        this.y = y;
    }

    public boolean isNewStroke() {
        return isNewStroke;
    }

    public void setNewStroke(boolean newStroke) {
        isNewStroke = newStroke;
    }

    @Override
    public String toString() {
        return "DrawData{" +
                "roomId='" + roomId + '\'' +
                ", x=" + x +
                ", y=" + y +
                ", isNewStroke=" + isNewStroke +
                '}';
    }
}