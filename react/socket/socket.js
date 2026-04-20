import { io } from "socket.io-client";
import { API } from "../api/api";

export const socket = io(API);
