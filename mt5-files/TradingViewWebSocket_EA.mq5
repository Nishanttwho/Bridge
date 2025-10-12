//+------------------------------------------------------------------+
//|                                  TradingViewWebSocket_EA.mq5     |
//|                        WebSocket-Based Expert Advisor            |
//|                           Real-time Command Execution            |
//+------------------------------------------------------------------+
#property copyright "TradingView Signal Executor - WebSocket Version"
#property version   "1.00"
#property strict

// Input parameters
input string ServerURL = "wss://your-replit-app.replit.dev";  // WebSocket server URL (use wss:// for https)
input string ApiSecret = "your-secret-key-here";   // API secret for authentication
input double MaxSlippagePercent = 0.5;             // Max slippage as % of entry price

// Global variables
string wsUrl;
int wsHandle = -1;
bool isConnected = false;
ENUM_ORDER_TYPE_FILLING brokerFillingMode;
datetime lastHeartbeat;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("=== Initializing TradingView WebSocket EA ===");
   
   // Detect broker's order filling mode
   brokerFillingMode = DetectBrokerFillingMode();
   Print("Detected broker filling mode: ", EnumToString(brokerFillingMode));
   
   // Build WebSocket URL
   // Convert https:// to wss:// or http:// to ws://
   wsUrl = ServerURL;
   StringReplace(wsUrl, "https://", "wss://");
   StringReplace(wsUrl, "http://", "ws://");
   wsUrl = wsUrl + "/mt5-ws?secret=" + ApiSecret;
   
   Print("WebSocket URL: ", wsUrl);
   Print("IMPORTANT: Add this URL to WebRequest whitelist:");
   Print("Tools -> Options -> Expert Advisors -> Allow WebRequest for:");
   Print(ServerURL);
   
   // Connect to WebSocket
   ConnectWebSocket();
   
   // Set timer for heartbeat and reconnection checks
   EventSetTimer(5);  // Check every 5 seconds
   
   Print("=== EA initialized successfully! ===");
   
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("=== Shutting down TradingView EA ===");
   EventKillTimer();
   
   if(wsHandle >= 0)
   {
      SocketClose(wsHandle);
      wsHandle = -1;
   }
}

//+------------------------------------------------------------------+
//| Timer function - check connection and heartbeat                  |
//+------------------------------------------------------------------+
void OnTimer()
{
   // Check if we need to reconnect
   if(!isConnected || wsHandle < 0)
   {
      ConnectWebSocket();
   }
   
   // Check for incoming messages
   if(isConnected && wsHandle >= 0)
   {
      CheckForMessages();
   }
}

//+------------------------------------------------------------------+
//| Connect to WebSocket server                                      |
//+------------------------------------------------------------------+
void ConnectWebSocket()
{
   if(wsHandle >= 0)
   {
      SocketClose(wsHandle);
      wsHandle = -1;
   }
   
   // Extract host and path from URL
   string host = "";
   string path = "/mt5-ws?secret=" + ApiSecret;
   int port = 443;  // Default HTTPS port
   bool useSSL = true;
   
   // Parse URL
   if(StringFind(wsUrl, "wss://") == 0)
   {
      host = StringSubstr(wsUrl, 6);
      useSSL = true;
      port = 443;
   }
   else if(StringFind(wsUrl, "ws://") == 0)
   {
      host = StringSubstr(wsUrl, 5);
      useSSL = false;
      port = 80;
   }
   
   // Extract host and path
   int pathStart = StringFind(host, "/");
   if(pathStart > 0)
   {
      path = StringSubstr(host, pathStart);
      host = StringSubstr(host, 0, pathStart);
   }
   
   // Check for port in host
   int portPos = StringFind(host, ":");
   if(portPos > 0)
   {
      port = (int)StringToInteger(StringSubstr(host, portPos + 1));
      host = StringSubstr(host, 0, portPos);
   }
   
   Print("[WS] Connecting to: ", host, ":", port, path);
   
   // Create socket
   wsHandle = SocketCreate();
   if(wsHandle < 0)
   {
      Print("[WS ERROR] Failed to create socket: ", GetLastError());
      return;
   }
   
   // Connect socket
   if(!SocketConnect(wsHandle, host, port, 5000))
   {
      int error = GetLastError();
      Print("[WS ERROR] Failed to connect: ", error);
      if(error == 4014)
         Print("[WS ERROR] URL not in WebRequest whitelist. Add ", ServerURL, " to allowed URLs");
      SocketClose(wsHandle);
      wsHandle = -1;
      return;
   }
   
   // Send WebSocket handshake
   string handshake = 
      "GET " + path + " HTTP/1.1\r\n" +
      "Host: " + host + "\r\n" +
      "Upgrade: websocket\r\n" +
      "Connection: Upgrade\r\n" +
      "Sec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw==\r\n" +
      "Sec-WebSocket-Version: 13\r\n" +
      "\r\n";
   
   if(SocketSend(wsHandle, handshake, StringLen(handshake)) < 0)
   {
      Print("[WS ERROR] Failed to send handshake: ", GetLastError());
      SocketClose(wsHandle);
      wsHandle = -1;
      return;
   }
   
   // Read handshake response
   string response = "";
   char buffer[];
   uint timeout = GetTickCount() + 5000;
   
   while(GetTickCount() < timeout)
   {
      int received = SocketIsReadable(wsHandle);
      if(received > 0)
      {
         ArrayResize(buffer, received);
         int bytes = SocketRead(wsHandle, buffer, received, 100);
         if(bytes > 0)
         {
            response += CharArrayToString(buffer, 0, bytes);
            if(StringFind(response, "\r\n\r\n") >= 0)
               break;
         }
      }
      Sleep(10);
   }
   
   // Check if handshake successful
   if(StringFind(response, "101") >= 0 && StringFind(response, "Upgrade") >= 0)
   {
      isConnected = true;
      lastHeartbeat = TimeCurrent();
      Print("[WS] Connected successfully!");
   }
   else
   {
      Print("[WS ERROR] Handshake failed. Response: ", response);
      SocketClose(wsHandle);
      wsHandle = -1;
      isConnected = false;
   }
}

//+------------------------------------------------------------------+
//| Check for incoming WebSocket messages                            |
//+------------------------------------------------------------------+
void CheckForMessages()
{
   if(wsHandle < 0 || !isConnected)
      return;
   
   int readable = SocketIsReadable(wsHandle);
   if(readable <= 0)
      return;
   
   char buffer[];
   ArrayResize(buffer, readable);
   
   int bytes = SocketRead(wsHandle, buffer, readable, 100);
   if(bytes <= 0)
      return;
   
   // Decode WebSocket frame
   string message = DecodeWebSocketFrame(buffer, bytes);
   if(message != "")
   {
      ProcessCommand(message);
   }
}

//+------------------------------------------------------------------+
//| Decode WebSocket frame                                           |
//+------------------------------------------------------------------+
string DecodeWebSocketFrame(char &buffer[], int length)
{
   if(length < 2)
      return "";
   
   // Check FIN bit and opcode
   uchar fin = (buffer[0] & 0x80) >> 7;
   uchar opcode = buffer[0] & 0x0F;
   
   // Opcode 1 = text, 8 = close, 9 = ping, 10 = pong
   if(opcode == 8)
   {
      Print("[WS] Connection closed by server");
      isConnected = false;
      return "";
   }
   
   if(opcode == 9)  // Ping
   {
      SendPong();
      return "";
   }
   
   if(opcode != 1)  // Not text
      return "";
   
   // Get payload length
   uchar masked = (buffer[1] & 0x80) >> 7;
   uint payloadLength = buffer[1] & 0x7F;
   int offset = 2;
   
   if(payloadLength == 126)
   {
      payloadLength = (buffer[2] << 8) | buffer[3];
      offset = 4;
   }
   else if(payloadLength == 127)
   {
      // 64-bit length (not commonly needed)
      offset = 10;
   }
   
   // Extract payload
   if(offset + payloadLength > length)
      return "";
   
   char payload[];
   ArrayResize(payload, (int)payloadLength);
   ArrayCopy(payload, buffer, 0, offset, (int)payloadLength);
   
   return CharArrayToString(payload);
}

//+------------------------------------------------------------------+
//| Send WebSocket message                                           |
//+------------------------------------------------------------------+
bool SendWebSocketMessage(string message)
{
   if(wsHandle < 0 || !isConnected)
      return false;
   
   // Create WebSocket frame
   char frame[];
   char messageBytes[];
   StringToCharArray(message, messageBytes);
   int messageLen = ArraySize(messageBytes) - 1;  // Exclude null terminator
   
   int frameSize = 2 + messageLen;
   if(messageLen > 125)
      frameSize += 2;
   
   ArrayResize(frame, frameSize);
   
   // FIN bit + opcode 1 (text)
   frame[0] = 0x81;
   
   // Payload length
   int offset = 2;
   if(messageLen <= 125)
   {
      frame[1] = (char)messageLen;
   }
   else
   {
      frame[1] = 126;
      frame[2] = (char)((messageLen >> 8) & 0xFF);
      frame[3] = (char)(messageLen & 0xFF);
      offset = 4;
   }
   
   // Copy payload
   ArrayCopy(frame, messageBytes, offset, 0, messageLen);
   
   // Send frame
   int sent = SocketSend(wsHandle, frame, frameSize);
   return sent == frameSize;
}

//+------------------------------------------------------------------+
//| Send pong response                                               |
//+------------------------------------------------------------------+
void SendPong()
{
   char frame[2];
   frame[0] = 0x8A;  // FIN + opcode 10 (pong)
   frame[1] = 0x00;  // No payload
   SocketSend(wsHandle, frame, 2);
}

//+------------------------------------------------------------------+
//| Process received command                                          |
//+------------------------------------------------------------------+
void ProcessCommand(string commandJson)
{
   string commandId = GetJsonValue(commandJson, "id");
   string action = GetJsonValue(commandJson, "action");
   
   if(commandId == "")
   {
      Print("[WS ERROR] No command ID");
      return;
   }
   
   Print("[WS COMMAND] ID: ", commandId, ", Action: ", action);
   
   if(action == "PING")
      SendReport(commandId, true, "", "", "");
   else if(action == "TRADE")
      ExecuteTrade(commandId, commandJson);
   else if(action == "CLOSE")
      ClosePosition(commandId, commandJson);
   else
      SendReport(commandId, false, "", "", "Unknown action: " + action);
}

//+------------------------------------------------------------------+
//| Detect broker's supported order filling mode                     |
//+------------------------------------------------------------------+
ENUM_ORDER_TYPE_FILLING DetectBrokerFillingMode()
{
   string symbol = Symbol();
   int filling = (int)SymbolInfoInteger(symbol, SYMBOL_FILLING_MODE);
   
   if((filling & SYMBOL_FILLING_FOK) == SYMBOL_FILLING_FOK)
      return ORDER_FILLING_FOK;
   else if((filling & SYMBOL_FILLING_IOC) == SYMBOL_FILLING_IOC)
      return ORDER_FILLING_IOC;
   else
      return ORDER_FILLING_RETURN;
}

//+------------------------------------------------------------------+
//| Normalize price to symbol's tick size                            |
//+------------------------------------------------------------------+
double NormalizePrice(string symbol, double price)
{
   double tickSize = SymbolInfoDouble(symbol, SYMBOL_TRADE_TICK_SIZE);
   if(tickSize == 0) tickSize = SymbolInfoDouble(symbol, SYMBOL_POINT);
   
   int digits = (int)SymbolInfoInteger(symbol, SYMBOL_DIGITS);
   double normalized = MathRound(price / tickSize) * tickSize;
   return NormalizeDouble(normalized, digits);
}

//+------------------------------------------------------------------+
//| Normalize volume to symbol's lot step                            |
//+------------------------------------------------------------------+
double NormalizeVolume(string symbol, double volume)
{
   double minVolume = SymbolInfoDouble(symbol, SYMBOL_VOLUME_MIN);
   double maxVolume = SymbolInfoDouble(symbol, SYMBOL_VOLUME_MAX);
   double volumeStep = SymbolInfoDouble(symbol, SYMBOL_VOLUME_STEP);
   
   if(volumeStep == 0) volumeStep = 0.01;
   
   volume = MathRound(volume / volumeStep) * volumeStep;
   
   if(volume < minVolume) volume = minVolume;
   if(volume > maxVolume) volume = maxVolume;
   
   return volume;
}

//+------------------------------------------------------------------+
//| Ensure symbol is ready                                           |
//+------------------------------------------------------------------+
bool EnsureSymbolReady(string symbol)
{
   if(!SymbolInfoInteger(symbol, SYMBOL_SELECT))
   {
      if(!SymbolSelect(symbol, true))
      {
         Print("[ERROR] Symbol ", symbol, " not found");
         return false;
      }
   }
   
   int attempts = 0;
   while(!SymbolInfoInteger(symbol, SYMBOL_SELECT) && attempts < 50)
   {
      Sleep(100);
      attempts++;
   }
   
   if(!SymbolInfoInteger(symbol, SYMBOL_SELECT))
   {
      Print("[ERROR] Failed to load symbol ", symbol);
      return false;
   }
   
   Print("Symbol ", symbol, " loaded successfully");
   return true;
}

//+------------------------------------------------------------------+
//| Execute trade                                                     |
//+------------------------------------------------------------------+
void ExecuteTrade(string commandId, string commandJson)
{
   string symbol = GetJsonValue(commandJson, "symbol");
   string type = GetJsonValue(commandJson, "type");
   double volume = StringToDouble(GetJsonValue(commandJson, "volume"));
   double stopLoss = StringToDouble(GetJsonValue(commandJson, "stopLoss"));
   double takeProfit = StringToDouble(GetJsonValue(commandJson, "takeProfit"));
   
   Print("[TRADE] Symbol: ", symbol, ", Type: ", type, ", Volume: ", volume);
   Print("[TRADE] SL: ", stopLoss, ", TP: ", takeProfit);
   
   if(symbol == "" || type == "")
   {
      SendReport(commandId, false, "", "", "Missing symbol or type");
      return;
   }
   
   if(!EnsureSymbolReady(symbol))
   {
      SendReport(commandId, false, "", "", "Symbol not available: " + symbol);
      return;
   }
   
   volume = NormalizeVolume(symbol, volume);
   if(volume <= 0)
   {
      SendReport(commandId, false, "", "", "Invalid volume");
      return;
   }
   
   double currentPrice;
   if(type == "BUY")
      currentPrice = SymbolInfoDouble(symbol, SYMBOL_ASK);
   else
      currentPrice = SymbolInfoDouble(symbol, SYMBOL_BID);
   
   if(stopLoss > 0) stopLoss = NormalizePrice(symbol, stopLoss);
   if(takeProfit > 0) takeProfit = NormalizePrice(symbol, takeProfit);
   
   // Validate SL/TP
   if(type == "BUY")
   {
      if(stopLoss >= currentPrice)
      {
         SendReport(commandId, false, "", "", "Invalid SL for BUY");
         return;
      }
      if(takeProfit > 0 && takeProfit <= currentPrice)
      {
         SendReport(commandId, false, "", "", "Invalid TP for BUY");
         return;
      }
   }
   else
   {
      if(stopLoss <= currentPrice && stopLoss > 0)
      {
         SendReport(commandId, false, "", "", "Invalid SL for SELL");
         return;
      }
      if(takeProfit >= currentPrice)
      {
         SendReport(commandId, false, "", "", "Invalid TP for SELL");
         return;
      }
   }
   
   MqlTradeRequest request = {};
   MqlTradeResult result = {};
   
   request.action = TRADE_ACTION_DEAL;
   request.symbol = symbol;
   request.volume = volume;
   request.type = (type == "BUY") ? ORDER_TYPE_BUY : ORDER_TYPE_SELL;
   request.price = currentPrice;
   request.sl = stopLoss;
   request.tp = takeProfit;
   request.deviation = (ulong)(currentPrice * MaxSlippagePercent / 100.0 / SymbolInfoDouble(symbol, SYMBOL_POINT));
   request.magic = 123456;
   request.comment = "TradingView";
   request.type_filling = brokerFillingMode;
   
   if(!OrderSend(request, result))
   {
      string error = "OrderSend failed: " + IntegerToString(GetLastError());
      Print("[TRADE ERROR] ", error);
      SendReport(commandId, false, "", "", error);
      return;
   }
   
   if(result.retcode != TRADE_RETCODE_DONE)
   {
      string error = "Trade failed: retcode=" + IntegerToString(result.retcode);
      Print("[TRADE ERROR] ", error);
      SendReport(commandId, false, "", "", error);
      return;
   }
   
   Print("[TRADE SUCCESS] Order: ", result.order, ", Deal: ", result.deal);
   SendReport(commandId, true, IntegerToString(result.order), IntegerToString(result.order), "");
}

//+------------------------------------------------------------------+
//| Close position                                                    |
//+------------------------------------------------------------------+
void ClosePosition(string commandId, string commandJson)
{
   string positionId = GetJsonValue(commandJson, "positionId");
   ulong ticket = StringToInteger(positionId);
   
   if(!PositionSelectByTicket(ticket))
   {
      SendReport(commandId, false, "", "", "Position not found: " + positionId);
      return;
   }
   
   MqlTradeRequest request = {};
   MqlTradeResult result = {};
   
   request.action = TRADE_ACTION_DEAL;
   request.position = ticket;
   request.symbol = PositionGetString(POSITION_SYMBOL);
   request.volume = PositionGetDouble(POSITION_VOLUME);
   request.type = (PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY) ? ORDER_TYPE_SELL : ORDER_TYPE_BUY;
   request.price = (request.type == ORDER_TYPE_SELL) ? SymbolInfoDouble(request.symbol, SYMBOL_BID) : SymbolInfoDouble(request.symbol, SYMBOL_ASK);
   request.deviation = 10;
   request.magic = 123456;
   request.type_filling = brokerFillingMode;
   
   if(!OrderSend(request, result))
   {
      SendReport(commandId, false, "", "", "Close failed: " + IntegerToString(GetLastError()));
      return;
   }
   
   Print("[CLOSE SUCCESS] Position ", positionId, " closed");
   SendReport(commandId, true, "", "", "");
}

//+------------------------------------------------------------------+
//| Send execution report via WebSocket                              |
//+------------------------------------------------------------------+
void SendReport(string commandId, bool success, string orderId, string positionId, string error)
{
   string report = "{";
   report += "\"commandId\":\"" + commandId + "\",";
   report += "\"success\":" + (success ? "true" : "false");
   if(orderId != "") report += ",\"orderId\":\"" + orderId + "\"";
   if(positionId != "") report += ",\"positionId\":\"" + positionId + "\"";
   if(error != "") report += ",\"error\":\"" + EscapeJsonString(error) + "\"";
   report += "}";
   
   if(SendWebSocketMessage(report))
   {
      Print("[REPORT] Sent successfully");
   }
   else
   {
      Print("[REPORT ERROR] Failed to send");
   }
}

//+------------------------------------------------------------------+
//| Escape JSON special characters                                   |
//+------------------------------------------------------------------+
string EscapeJsonString(string str)
{
   StringReplace(str, "\\", "\\\\");
   StringReplace(str, "\"", "\\\"");
   StringReplace(str, "\n", "\\n");
   StringReplace(str, "\r", "\\r");
   StringReplace(str, "\t", "\\t");
   return str;
}

//+------------------------------------------------------------------+
//| Simple JSON value extractor                                      |
//+------------------------------------------------------------------+
string GetJsonValue(string json, string key)
{
   string searchKey = "\"" + key + "\"";
   int startPos = StringFind(json, searchKey);
   
   if(startPos == -1) return "";
   
   startPos += StringLen(searchKey);
   while(startPos < StringLen(json) && (StringGetCharacter(json, startPos) == ' ' || StringGetCharacter(json, startPos) == ':'))
      startPos++;
   
   bool isString = (StringGetCharacter(json, startPos) == '"');
   if(isString) startPos++;
   
   int endPos = startPos;
   
   if(isString)
   {
      while(endPos < StringLen(json) && StringGetCharacter(json, endPos) != '"')
         endPos++;
   }
   else
   {
      while(endPos < StringLen(json) && StringGetCharacter(json, endPos) != ',' && StringGetCharacter(json, endPos) != '}')
         endPos++;
   }
   
   return StringSubstr(json, startPos, endPos - startPos);
}
//+------------------------------------------------------------------+
