import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

const API_KEY = "AIzaSyDeH-PwgYwsxMfwwIgPt9jw6wQ35qlwurQ"; 
const genAI = new GoogleGenerativeAI(API_KEY);


require('dotenv').config();
const apiKey = process.env.API_KEY;