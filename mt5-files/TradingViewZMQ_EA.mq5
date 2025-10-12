//+------------------------------------------------------------------+
//|                                           TradingViewZMQ_EA.mq5  |
//|                                  Expert Advisor for TradingView  |
//|                                         ZeroMQ Bridge for MT5    |
//+------------------------------------------------------------------+
#property copyright "TradingView Signal Executor"
#property version   "1.00"
#property strict

// Import ZeroMQ library
#include <Zmq/Zmq.mqh>

// Global variables
Context context;
Socket pushSocket(context, ZMQ_PUSH);  // For sending responses
Socket pullSocket(context, ZMQ_PULL);  // For receiving commands

string PUSH_PORT = "5556";  // Port for sending responses to Node.js
string PULL_PORT = "5555";  // Port for receiving commands from Node.js

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("Initializing TradingView ZeroMQ Bridge EA...");
   
   // Bind push socket for sending responses
   if(!pushSocket.bind("tcp://*:" + PUSH_PORT))
   {
      Print("ERROR: Failed to bind PUSH socket on port ", PUSH_PORT);
      return(INIT_FAILED);
   }
   Print("PUSH socket bound on port ", PUSH_PORT);
   
   // Bind pull socket for receiving commands
   if(!pullSocket.bind("tcp://*:" + PULL_PORT))
   {
      Print("ERROR: Failed to bind PULL socket on port ", PULL_PORT);
      return(INIT_FAILED);
   }
   Print("PULL socket bound on port ", PULL_PORT);
   
   Print("TradingView ZeroMQ Bridge EA initialized successfully!");
   Print("Listening for commands on port ", PULL_PORT);
   Print("Sending responses on port ", PUSH_PORT);
   
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("Shutting down TradingView ZeroMQ Bridge EA...");
   pushSocket.unbind("tcp://*:" + PUSH_PORT);
   pullSocket.unbind("tcp://*:" + PULL_PORT);
   Print("ZeroMQ sockets closed.");
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   // Check for incoming commands (non-blocking)
   ZmqMsg request;
   
   if(pullSocket.recv(request, true))  // Non-blocking receive
   {
      string commandJson = request.getData();
      Print("Received command: ", commandJson);
      
      // Process command and send response
      string response = ProcessCommand(commandJson);
      
      ZmqMsg reply(response);
      pushSocket.send(reply);
      Print("Sent response: ", response);
   }
}

//+------------------------------------------------------------------+
//| Process incoming command                                          |
//+------------------------------------------------------------------+
string ProcessCommand(string commandJson)
{
   // Parse JSON command
   // Format: {"action":"TRADE","data":{"symbol":"EURUSD","type":"BUY","volume":0.01}}
   
   string action = GetJsonValue(commandJson, "action");
   
   if(action == "PING")
   {
      return "{\"success\":true,\"data\":\"PONG\"}";
   }
   else if(action == "TRADE")
   {
      return ExecuteTrade(commandJson);
   }
   else if(action == "CLOSE")
   {
      return ClosePosition(commandJson);
   }
   else if(action == "GET_ACCOUNT")
   {
      return GetAccountInfo();
   }
   else if(action == "GET_POSITIONS")
   {
      return GetOpenPositions();
   }
   else if(action == "GET_PRICE")
   {
      return GetSymbolPrice(commandJson);
   }
   else
   {
      return "{\"success\":false,\"error\":\"Unknown action: " + action + "\"}";
   }
}

//+------------------------------------------------------------------+
//| Execute trade                                                     |
//+------------------------------------------------------------------+
string ExecuteTrade(string commandJson)
{
   string symbol = GetJsonValue(GetJsonValue(commandJson, "data"), "symbol");
   string type = GetJsonValue(GetJsonValue(commandJson, "data"), "type");
   double volume = StringToDouble(GetJsonValue(GetJsonValue(commandJson, "data"), "volume"));
   double stopLoss = StringToDouble(GetJsonValue(GetJsonValue(commandJson, "data"), "stopLoss"));
   double takeProfit = StringToDouble(GetJsonValue(GetJsonValue(commandJson, "data"), "takeProfit"));
   
   MqlTradeRequest request = {};
   MqlTradeResult result = {};
   
   request.action = TRADE_ACTION_DEAL;
   request.symbol = symbol;
   request.volume = volume;
   request.type = (type == "BUY") ? ORDER_TYPE_BUY : ORDER_TYPE_SELL;
   request.price = (type == "BUY") ? SymbolInfoDouble(symbol, SYMBOL_ASK) : SymbolInfoDouble(symbol, SYMBOL_BID);
   request.sl = stopLoss;
   request.tp = takeProfit;
   request.deviation = 10;
   request.magic = 123456;
   request.comment = "TradingView Signal";
   request.type_filling = ORDER_FILLING_IOC;
   
   if(!OrderSend(request, result))
   {
      return "{\"success\":false,\"error\":\"OrderSend failed: " + IntegerToString(GetLastError()) + "\"}";
   }
   
   if(result.retcode != TRADE_RETCODE_DONE)
   {
      return "{\"success\":false,\"error\":\"Trade failed with retcode: " + IntegerToString(result.retcode) + "\"}";
   }
   
   string response = "{\"success\":true,\"data\":{";
   response += "\"orderId\":\"" + IntegerToString(result.order) + "\",";
   response += "\"positionId\":\"" + IntegerToString(result.order) + "\",";
   response += "\"ticket\":\"" + IntegerToString(result.order) + "\"";
   response += "}}";
   
   return response;
}

//+------------------------------------------------------------------+
//| Close position                                                    |
//+------------------------------------------------------------------+
string ClosePosition(string commandJson)
{
   string positionId = GetJsonValue(GetJsonValue(commandJson, "data"), "positionId");
   if(positionId == "") positionId = GetJsonValue(GetJsonValue(commandJson, "data"), "ticket");
   
   ulong ticket = StringToInteger(positionId);
   
   if(!PositionSelectByTicket(ticket))
   {
      return "{\"success\":false,\"error\":\"Position not found: " + positionId + "\"}";
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
   request.type_filling = ORDER_FILLING_IOC;
   
   if(!OrderSend(request, result))
   {
      return "{\"success\":false,\"error\":\"Close failed: " + IntegerToString(GetLastError()) + "\"}";
   }
   
   return "{\"success\":true}";
}

//+------------------------------------------------------------------+
//| Get account information                                           |
//+------------------------------------------------------------------+
string GetAccountInfo()
{
   string response = "{\"success\":true,\"data\":{";
   response += "\"balance\":" + DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE), 2) + ",";
   response += "\"equity\":" + DoubleToString(AccountInfoDouble(ACCOUNT_EQUITY), 2) + ",";
   response += "\"margin\":" + DoubleToString(AccountInfoDouble(ACCOUNT_MARGIN), 2) + ",";
   response += "\"freeMargin\":" + DoubleToString(AccountInfoDouble(ACCOUNT_MARGIN_FREE), 2);
   response += "}}";
   
   return response;
}

//+------------------------------------------------------------------+
//| Get open positions                                                |
//+------------------------------------------------------------------+
string GetOpenPositions()
{
   string positions = "[";
   int total = PositionsTotal();
   
   for(int i = 0; i < total; i++)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0)
      {
         if(i > 0) positions += ",";
         
         positions += "{";
         positions += "\"ticket\":\"" + IntegerToString(ticket) + "\",";
         positions += "\"symbol\":\"" + PositionGetString(POSITION_SYMBOL) + "\",";
         positions += "\"type\":\"" + ((PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY) ? "BUY" : "SELL") + "\",";
         positions += "\"volume\":" + DoubleToString(PositionGetDouble(POSITION_VOLUME), 2) + ",";
         positions += "\"openPrice\":" + DoubleToString(PositionGetDouble(POSITION_PRICE_OPEN), 5) + ",";
         positions += "\"profit\":" + DoubleToString(PositionGetDouble(POSITION_PROFIT), 2);
         positions += "}";
      }
   }
   
   positions += "]";
   
   return "{\"success\":true,\"data\":" + positions + "}";
}

//+------------------------------------------------------------------+
//| Get symbol price                                                  |
//+------------------------------------------------------------------+
string GetSymbolPrice(string commandJson)
{
   string symbol = GetJsonValue(GetJsonValue(commandJson, "data"), "symbol");
   
   double bid = SymbolInfoDouble(symbol, SYMBOL_BID);
   double ask = SymbolInfoDouble(symbol, SYMBOL_ASK);
   
   if(bid == 0 || ask == 0)
   {
      return "{\"success\":false,\"error\":\"Failed to get price for " + symbol + "\"}";
   }
   
   string response = "{\"success\":true,\"data\":{";
   response += "\"bid\":" + DoubleToString(bid, 5) + ",";
   response += "\"ask\":" + DoubleToString(ask, 5);
   response += "}}";
   
   return response;
}

//+------------------------------------------------------------------+
//| Simple JSON value extractor (basic implementation)               |
//+------------------------------------------------------------------+
string GetJsonValue(string json, string key)
{
   string searchKey = "\"" + key + "\"";
   int startPos = StringFind(json, searchKey);
   
   if(startPos == -1) return "";
   
   startPos += StringLen(searchKey);
   
   // Skip whitespace and colon
   while(startPos < StringLen(json) && (StringGetCharacter(json, startPos) == ' ' || StringGetCharacter(json, startPos) == ':'))
      startPos++;
   
   // Check if value is a string (starts with ")
   bool isString = (StringGetCharacter(json, startPos) == '"');
   if(isString) startPos++; // Skip opening quote
   
   // Check if value is an object (starts with {)
   bool isObject = (StringGetCharacter(json, startPos) == '{');
   
   int endPos = startPos;
   
   if(isObject)
   {
      int braceCount = 1;
      endPos++;
      while(endPos < StringLen(json) && braceCount > 0)
      {
         if(StringGetCharacter(json, endPos) == '{') braceCount++;
         if(StringGetCharacter(json, endPos) == '}') braceCount--;
         endPos++;
      }
   }
   else if(isString)
   {
      // Find closing quote
      while(endPos < StringLen(json) && StringGetCharacter(json, endPos) != '"')
         endPos++;
   }
   else
   {
      // Find comma or closing brace
      while(endPos < StringLen(json) && StringGetCharacter(json, endPos) != ',' && StringGetCharacter(json, endPos) != '}')
         endPos++;
   }
   
   return StringSubstr(json, startPos, endPos - startPos);
}
