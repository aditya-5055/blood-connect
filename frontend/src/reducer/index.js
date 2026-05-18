import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "../slices/authSlice";
import notificationReducer from "../slices/notificationSlice"; // ✅ NEW

const rootReducer = combineReducers({
  auth: authReducer,
  notification: notificationReducer, // ✅ NEW
});

export default rootReducer;