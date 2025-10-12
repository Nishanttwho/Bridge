//+------------------------------------------------------------------+
//|                                  TradingViewHTTP_EA_FIXED.mq5   |
//|                        PRODUCTION-SAFE Expert Advisor           |
//|                           Fixed ALL Critical Issues             |
//+------------------------------------------------------------------+
#property copyright "TradingView Signal Executor - Fixed Version"
#property version   "3.00"
#property strict

// Input parameters
input string ServerURL = "http://localhost:5000";  // Node.js server URL
input string ApiSecret = "your-secret-key-here";   // API secret for authentication
input int PollInterval = 1000;                      // Poll interval in milliseconds
input int MaxReportRetries = 3;                    // Max retries for sending reports
input double MaxSlippagePercent = 0.5;             // Max slippage as % of entry price

// Global variables
string nextCommandURL;
string reportURL;
ENUM_ORDER_TYPE_FILLING brokerFillingMode;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("=== Initializing FIXED TradingView HTTP Polling EA ===");
   
   // Build API URLs
   nextCommandURL = ServerURL + "/api/mt5/next-command";
   reportURL = ServerURL + "/api/mt5/report";
   
   // Detect broker's order filling mode
   brokerFillingMode = DetectBrokerFillingMode();
   Print("Detected broker filling mode: ", EnumToString(brokerFillingMode));
   
   // Add URLs to allowed WebRequest list
   Print("IMPORTANT: Add this URL to WebRequest whitelist:");
   Print("Tools -> Options -> Expert Advisors -> Allow WebRequest for:");
   Print(ServerURL);
   
   // Set timer for polling
   EventSetMillisecondTimer(PollInterval);
   
   Print("=== EA initialized successfully! ===");
   Print("Polling: ", nextCommandURL);
   Print("Poll interval: ", PollInterval, "ms");
   
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("=== Shutting down TradingView EA ===");
   EventKillTimer();
}

//+------------------------------------------------------------------+
//| Timer function - polls for commands                             |
//+------------------------------------------------------------------+
void OnTimer()
{
   PollForCommand();
}

//+------------------------------------------------------------------+
//| Detect broker's supported order filling mode                     |
//+------------------------------------------------------------------+
ENUM_ORDER_TYPE_FILLING DetectBrokerFillingMode()
{
   string symbol = Symbol();
   ENUM_SYMBOL_TRADE_EXECUTION exec_mode = (ENUM_SYMBOL_TRADE_EXECUTION)SymbolInfoInteger(symbol, SYMBOL_TRADE_EXEMODE);
   
   int filling = (int)SymbolInfoInteger(symbol, SYMBOL_FILLING_MODE);
   
   // Check supported filling modes
   if((filling & SYMBOL_FILLING_FOK) == SYMBOL_FILLING_FOK)
      return ORDER_FILLING_FOK;  // Fill or Kill
   else if((filling & SYMBOL_FILLING_IOC) == SYMBOL_FILLING_IOC)
      return ORDER_FILLING_IOC;  // Immediate or Cancel
   else
      return ORDER_FILLING_RETURN;  // Return execution
}

//+------------------------------------------------------------------+
//| Get pip value for a symbol (handles JPY, crypto, indices)        |
//+------------------------------------------------------------------+
double GetPipValue(string symbol)
{
   int digits = (int)SymbolInfoInteger(symbol, SYMBOL_DIGITS);
   
   // Check symbol name for instrument type (more reliable than digits alone)
   string upperSymbol = symbol;
   StringToUpper(upperSymbol);
   
   // Crypto: BTC, ETH, XRP, etc. (use point value * 10)
   if(StringFind(upperSymbol, "BTC") >= 0 || StringFind(upperSymbol, "ETH") >= 0 || 
      StringFind(upperSymbol, "XRP") >= 0 || StringFind(upperSymbol, "CRYPTO") >= 0)
      return SymbolInfoDouble(symbol, SYMBOL_POINT) * 10;
   
   // Indices: US30, NAS100, SPX500, GER40, etc.
   if(StringFind(upperSymbol, "US30") >= 0 || StringFind(upperSymbol, "NAS") >= 0 || 
      StringFind(upperSymbol, "SPX") >= 0 || StringFind(upperSymbol, "GER") >= 0 ||
      StringFind(upperSymbol, "FTSE") >= 0 || StringFind(upperSymbol, "DAX") >= 0)
      return SymbolInfoDouble(symbol, SYMBOL_POINT) * 10;
   
   // JPY pairs: check symbol name, not just digits
   if(StringFind(upperSymbol, "JPY") >= 0)
      return 0.01;
   
   // Standard forex (4-5 digits): pip = 0.0001
   if(digits == 4 || digits == 5)
      return 0.0001;
   
   // Fallback: use point value * 10
   return SymbolInfoDouble(symbol, SYMBOL_POINT) * 10;
}

//+------------------------------------------------------------------+
//| Normalize price to symbol's tick size and round to correct digits|
//+------------------------------------------------------------------+
double NormalizePrice(string symbol, double price)
{
   double tickSize = SymbolInfoDouble(symbol, SYMBOL_TRADE_TICK_SIZE);
   if(tickSize == 0) tickSize = SymbolInfoDouble(symbol, SYMBOL_POINT);
   
   int digits = (int)SymbolInfoInteger(symbol, SYMBOL_DIGITS);
   
   // Round to tick size then to correct digits
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
   
   // Round to step
   volume = MathRound(volume / volumeStep) * volumeStep;
   
   // Clamp to min/max
   if(volume < minVolume) volume = minVolume;
   if(volume > maxVolume) volume = maxVolume;
   
   return volume;
}

//+------------------------------------------------------------------+
//| Ensure symbol is available and loaded                            |
//+------------------------------------------------------------------+
bool EnsureSymbolReady(string symbol)
{
   // Check if symbol exists
   if(!SymbolInfoInteger(symbol, SYMBOL_SELECT))
   {
      // Try to add to Market Watch
      if(!SymbolSelect(symbol, true))
      {
         Print("ERROR: Symbol ", symbol, " not found");
         return false;
      }
   }
   
   // Wait for symbol to load (max 5 seconds)
   int attempts = 0;
   while(!SymbolInfoInteger(symbol, SYMBOL_SELECT) && attempts < 50)
   {
      Sleep(100);
      attempts++;
   }
   
   if(!SymbolInfoInteger(symbol, SYMBOL_SELECT))
   {
      Print("ERROR: Failed to load symbol ", symbol);
      return false;
   }
   
   Print("Symbol ", symbol, " loaded successfully");
   return true;
}

//+------------------------------------------------------------------+
//| Poll server for next command                                     |
//+------------------------------------------------------------------+
void PollForCommand()
{
   string headers = "X-MT5-Api-Secret: " + ApiSecret + "\r\n";
   string responseHeaders;
   char responseData[];
   char postData[];
   int timeout = 5000;
   
   // WebRequest returns number of bytes received, NOT HTTP status code!
   int bytesReceived = WebRequest("GET", nextCommandURL, headers, timeout, postData, responseData, responseHeaders);
   
   if(bytesReceived == -1)
   {
      int error = GetLastError();
      if(error == 4060)
         Print("ERROR: URL not whitelisted. Add ", ServerURL, " to Tools->Options->Expert Advisors");
      return;
   }
   
   // Parse HTTP status from response headers
   int httpStatus = GetHttpStatus(responseHeaders);
   
   if(httpStatus == 204) return;  // No commands (normal)
   
   if(httpStatus == 200 && bytesReceived > 0)
   {
      string responseText = CharArrayToString(responseData);
      ProcessCommand(responseText);
   }
   else if(httpStatus != 204)
   {
      Print("Unexpected HTTP status: ", httpStatus);
   }
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
      Print("ERROR: No command ID");
      return;
   }
   
   Print("[COMMAND] ID: ", commandId, ", Action: ", action);
   
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
//| Execute trade with full validation                               |
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
   
   // Validate inputs
   if(symbol == "" || type == "")
   {
      SendReport(commandId, false, "", "", "Missing symbol or type");
      return;
   }
   
   // Ensure symbol is ready
   if(!EnsureSymbolReady(symbol))
   {
      SendReport(commandId, false, "", "", "Symbol not available: " + symbol);
      return;
   }
   
   // Normalize volume
   volume = NormalizeVolume(symbol, volume);
   if(volume <= 0)
   {
      SendReport(commandId, false, "", "", "Invalid volume");
      return;
   }
   
   // Get current price
   double currentPrice;
   if(type == "BUY")
      currentPrice = SymbolInfoDouble(symbol, SYMBOL_ASK);
   else
      currentPrice = SymbolInfoDouble(symbol, SYMBOL_BID);
   
   // Normalize SL/TP
   if(stopLoss > 0) stopLoss = NormalizePrice(symbol, stopLoss);
   if(takeProfit > 0) takeProfit = NormalizePrice(symbol, takeProfit);
   
   // Validate SL/TP direction
   if(type == "BUY")
   {
      if(stopLoss >= currentPrice)
      {
         SendReport(commandId, false, "", "", "Invalid SL for BUY (must be < current price)");
         return;
      }
      if(takeProfit > 0 && takeProfit <= currentPrice)
      {
         SendReport(commandId, false, "", "", "Invalid TP for BUY (must be > current price)");
         return;
      }
   }
   else  // SELL
   {
      if(stopLoss <= currentPrice && stopLoss > 0)
      {
         SendReport(commandId, false, "", "", "Invalid SL for SELL (must be > current price)");
         return;
      }
      if(takeProfit >= currentPrice)
      {
         SendReport(commandId, false, "", "", "Invalid TP for SELL (must be < current price)");
         return;
      }
   }
   
   // Build trade request
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
   
   // Execute trade
   if(!OrderSend(request, result))
   {
      string error = "OrderSend failed: " + IntegerToString(GetLastError());
      Print("[TRADE ERROR] ", error);
      SendReport(commandId, false, "", "", error);
      return;
   }
   
   if(result.retcode != TRADE_RETCODE_DONE)
   {
      string error = "Trade failed: retcode=" + IntegerToString(result.retcode) + " " + GetRetcodeDescription(result.retcode);
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
//| Send report with retry logic                                     |
//+------------------------------------------------------------------+
void SendReport(string commandId, bool success, string orderId, string positionId, string error)
{
   string body = "{";
   body += "\"commandId\":\"" + commandId + "\",";
   body += "\"success\":" + (success ? "true" : "false");
   if(orderId != "") body += ",\"orderId\":\"" + orderId + "\"";
   if(positionId != "") body += ",\"positionId\":\"" + positionId + "\"";
   if(error != "") body += ",\"error\":\"" + EscapeJsonString(error) + "\"";
   body += "}";
   
   // Retry logic
   for(int attempt = 1; attempt <= MaxReportRetries; attempt++)
   {
      if(SendHttpPost(body))
      {
         if(attempt > 1)
            Print("[REPORT] Sent successfully on attempt ", attempt);
         return;
      }
      
      if(attempt < MaxReportRetries)
      {
         Print("[REPORT] Failed attempt ", attempt, ", retrying...");
         Sleep(1000);
      }
   }
   
   Print("[REPORT ERROR] Failed after ", MaxReportRetries, " attempts");
}

//+------------------------------------------------------------------+
//| Send HTTP POST request                                           |
//+------------------------------------------------------------------+
bool SendHttpPost(string body)
{
   string headers = "Content-Type: application/json\r\nX-MT5-Api-Secret: " + ApiSecret + "\r\n";
   char responseData[];
   string responseHeaders;
   
   char postData[];
   StringToCharArray(body, postData, 0, StringLen(body));
   ArrayResize(postData, ArraySize(postData) - 1);
   
   // WebRequest returns bytes received, NOT HTTP status!
   int bytesReceived = WebRequest("POST", reportURL, headers, 5000, postData, responseData, responseHeaders);
   
   if(bytesReceived == -1)
   {
      Print("[HTTP ERROR] WebRequest failed: ", GetLastError());
      return false;
   }
   
   // Parse HTTP status from headers
   int httpStatus = GetHttpStatus(responseHeaders);
   
   if(httpStatus == 200)
      return true;
   
   Print("[HTTP ERROR] Response code: ", httpStatus, ", bytes: ", bytesReceived);
   return false;
}

//+------------------------------------------------------------------+
//| Get retcode description                                          |
//+------------------------------------------------------------------+
string GetRetcodeDescription(uint retcode)
{
   switch(retcode)
   {
      case TRADE_RETCODE_REQUOTE: return "Requote";
      case TRADE_RETCODE_REJECT: return "Request rejected";
      case TRADE_RETCODE_CANCEL: return "Request canceled";
      case TRADE_RETCODE_PLACED: return "Order placed";
      case TRADE_RETCODE_DONE: return "Done";
      case TRADE_RETCODE_DONE_PARTIAL: return "Done partially";
      case TRADE_RETCODE_ERROR: return "Error";
      case TRADE_RETCODE_TIMEOUT: return "Timeout";
      case TRADE_RETCODE_INVALID: return "Invalid request";
      case TRADE_RETCODE_INVALID_VOLUME: return "Invalid volume";
      case TRADE_RETCODE_INVALID_PRICE: return "Invalid price";
      case TRADE_RETCODE_INVALID_STOPS: return "Invalid stops";
      case TRADE_RETCODE_TRADE_DISABLED: return "Trade disabled";
      case TRADE_RETCODE_MARKET_CLOSED: return "Market closed";
      case TRADE_RETCODE_NO_MONEY: return "Not enough money";
      case TRADE_RETCODE_PRICE_CHANGED: return "Price changed";
      case TRADE_RETCODE_PRICE_OFF: return "No prices";
      case TRADE_RETCODE_INVALID_EXPIRATION: return "Invalid expiration";
      case TRADE_RETCODE_ORDER_CHANGED: return "Order changed";
      case TRADE_RETCODE_TOO_MANY_REQUESTS: return "Too many requests";
      default: return "Unknown error";
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
//| Extract HTTP status code from response headers                   |
//+------------------------------------------------------------------+
int GetHttpStatus(string headers)
{
   // Find "HTTP/1.1 200" or similar
   int pos = StringFind(headers, "HTTP/");
   if(pos == -1) return 0;
   
   // Skip to status code (after "HTTP/1.1 ")
   pos = StringFind(headers, " ", pos);
   if(pos == -1) return 0;
   
   pos++; // Skip space
   
   // Extract 3-digit status code
   string statusStr = StringSubstr(headers, pos, 3);
   return (int)StringToInteger(statusStr);
}
//+------------------------------------------------------------------+
