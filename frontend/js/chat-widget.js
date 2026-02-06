document.addEventListener("DOMContentLoaded",()=>{const chatToggle=document.getElementById("chatToggle"),chatWidget=document.getElementById("chatWidget"),chatOverlay=document.getElementById("chatOverlay"),chatMessages=document.getElementById("chatMessages"),userInput=document.getElementById("userInput"),sendButton=document.getElementById("sendButton"),micButton=document.getElementById("micButton"),minimizeChat=document.getElementById("minimizeChat"),soundToggle=document.getElementById("soundToggle"),quickActions=document.getElementById("quickActions");let isOpen=!1,isSoundEnabled=!0,isFirstOpen=!0;const API_URL="https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=GEMINI_KEY_REDACTED";function toggleChat(){if(isOpen=!isOpen,chatWidget.classList.toggle("open",isOpen),chatToggle.classList.toggle("active",isOpen),chatOverlay.classList.toggle("show",isOpen&&window.innerWidth<=480),isOpen){const badge=chatToggle.querySelector(".badge");badge&&(badge.style.display="none"),setTimeout(()=>userInput.focus(),300),isFirstOpen&&(isFirstOpen=!1)}window.innerWidth<=480&&(document.body.style.overflow=isOpen?"hidden":"")}function closeChat(){isOpen=!1,chatWidget.classList.remove("open"),chatToggle.classList.remove("active"),chatOverlay.classList.remove("show"),document.body.style.overflow=""}chatToggle&&chatToggle.addEventListener("click",toggleChat),chatOverlay&&chatOverlay.addEventListener("click",closeChat),minimizeChat&&minimizeChat.addEventListener("click",closeChat),document.addEventListener("keydown",e=>{e.key==="Escape"&&isOpen&&closeChat()}),soundToggle&&soundToggle.addEventListener("click",()=>{isSoundEnabled=!isSoundEnabled,isSoundEnabled||window.speechSynthesis.cancel(),soundToggle.querySelector("svg").innerHTML=isSoundEnabled?'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />':'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />'}),userInput&&(userInput.addEventListener("input",()=>{sendButton.disabled=userInput.value.trim()===""}),userInput.addEventListener("keydown",e=>{e.key==="Enter"&&!e.shiftKey&&(e.preventDefault(),sendMessage())})),sendButton&&sendButton.addEventListener("click",sendMessage),quickActions&&quickActions.addEventListener("click",e=>{if(e.target.classList.contains("quick-action-btn")){const message=e.target.dataset.message;userInput.value=message,sendButton.disabled=!1,sendMessage()}});const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;let recognition;SpeechRecognition&&micButton?(recognition=new SpeechRecognition,recognition.lang="ar-SA",recognition.interimResults=!1,recognition.maxAlternatives=1,recognition.onstart=()=>{micButton.classList.add("recording"),userInput.placeholder="\u062C\u0627\u0631\u064A \u0627\u0644\u0627\u0633\u062A\u0645\u0627\u0639..."},recognition.onend=()=>{micButton.classList.remove("recording"),userInput.placeholder="\u0627\u0643\u062A\u0628 \u0631\u0633\u0627\u0644\u062A\u0643 \u0647\u0646\u0627..."},recognition.onerror=event=>{console.error("Speech recognition error:",event.error),micButton.classList.remove("recording"),userInput.placeholder="\u062D\u062F\u062B \u062E\u0637\u0623\u060C \u062D\u0627\u0648\u0644 \u0645\u062C\u062F\u062F\u0627\u064B",setTimeout(()=>{userInput.placeholder="\u0627\u0643\u062A\u0628 \u0631\u0633\u0627\u0644\u062A\u0643 \u0647\u0646\u0627..."},2e3)},recognition.onresult=event=>{const speechResult=event.results[0][0].transcript;speechResult&&(userInput.value=speechResult,sendButton.disabled=!1,sendMessage())},micButton.addEventListener("click",()=>{try{micButton.classList.contains("recording")?recognition.stop():recognition.start()}catch(e){console.error("Recognition error:",e)}})):micButton&&(micButton.style.display="none");function getCurrentTime(){return new Date().toLocaleTimeString("ar-SA",{hour:"2-digit",minute:"2-digit",hour12:!0})}function parseMarkdown(text){if(!text)return"";let tempDiv=document.createElement("div");tempDiv.innerText=text;let cleanText=tempDiv.innerHTML;return cleanText=cleanText.replace(/^## (.*$)/gim,"<h3>$1</h3>"),cleanText=cleanText.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>"),cleanText=cleanText.replace(/\*(.*?)\*/g,"<em>$1</em>"),cleanText=cleanText.replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank" class="chat-link">$1</a>'),cleanText=cleanText.replace(/^\- (.*$)/gim,"\u2022 $1"),cleanText=cleanText.replace(/\n/g,"<br>"),cleanText}async function typeMessage(element,htmlContent){const regex=/(<[^>]+>|[^<])/g,matches=htmlContent.match(regex)||[];element.innerHTML="";for(const match of matches)element.innerHTML+=match,chatMessages.scrollTop=chatMessages.scrollHeight,match.startsWith("<")||await new Promise(resolve=>setTimeout(resolve,15))}function appendMessage(text,sender,isStreaming=!1){const welcomeMsg=chatMessages.querySelector(".welcome-message");welcomeMsg&&sender==="user"&&(welcomeMsg.style.display="none"),sender==="user"&&(quickActions.style.display="none");const wrapper=document.createElement("div");wrapper.classList.add("message-wrapper",sender);const avatarIcon=sender==="ai"?'<img src="frontend/assets/images/Gemini.webp.png" alt="AI" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">':'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />',formattedText=parseMarkdown(text);if(wrapper.innerHTML=`
            <div class="message-avatar">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    ${avatarIcon}
                </svg>
            </div>
            <div class="message-content">
                <div class="message-bubble">${isStreaming?"":formattedText}</div>
                <span class="message-time">${getCurrentTime()}</span>
            </div>
        `,chatMessages.appendChild(wrapper),chatMessages.scrollTop=chatMessages.scrollHeight,isStreaming)return{wrapper,bubble:wrapper.querySelector(".message-bubble"),formattedText}}function updateQuickActions(suggestions){quickActions&&(quickActions.innerHTML="",quickActions.style.display="flex",suggestions.forEach(suggestion=>{if(!suggestion.trim())return;const btn=document.createElement("button");btn.className="quick-action-btn",btn.dataset.message=suggestion.trim(),btn.textContent=suggestion.trim(),btn.style.opacity="0",btn.style.transform="translateY(10px)",quickActions.appendChild(btn),requestAnimationFrame(()=>{btn.style.transition="all 0.3s ease",btn.style.opacity="1",btn.style.transform="translateY(0)"})}),chatMessages.scrollTop=chatMessages.scrollHeight)}function showTypingIndicator(){const wrapper=document.createElement("div");wrapper.classList.add("message-wrapper","ai"),wrapper.id="typingIndicator",wrapper.innerHTML=`
            <div class="message-avatar">
                <img src="frontend/assets/images/Gemini.webp.png" alt="AI" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
            </div>
            <div class="message-content">
                <div class="message-bubble">
                    <div class="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        `,chatMessages.appendChild(wrapper),chatMessages.scrollTop=chatMessages.scrollHeight}function removeTypingIndicator(){const indicator=document.getElementById("typingIndicator");indicator&&indicator.remove()}async function sendMessage(){if(!userInput)return;const text=userInput.value.trim();if(text){appendMessage(text,"user"),userInput.value="",sendButton.disabled=!0,showTypingIndicator();try{const fullResponse=await callGeminiAPI(text);removeTypingIndicator();const parts=fullResponse.split("---SUGGESTIONS---"),mainAnswer=parts[0].trim(),suggestionsRaw=parts[1]?parts[1].trim():"",{bubble,formattedText}=appendMessage(mainAnswer,"ai",!0);if(await typeMessage(bubble,formattedText),isSoundEnabled&&speakText(mainAnswer),suggestionsRaw){const suggestions=suggestionsRaw.split(`
`).filter(s=>s.trim().length>0).slice(0,3);updateQuickActions(suggestions)}}catch(error){removeTypingIndicator(),appendMessage("\u0639\u0630\u0631\u0627\u064B\u060C \u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u0627\u062A\u0635\u0627\u0644. \u064A\u0631\u062C\u0649 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649.","ai"),console.error("API Error:",error)}}}async function callGeminiAPI(text){const response=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:`\u0623\u0646\u062A Yazeed AI\u060C \u0627\u0644\u0645\u0633\u0627\u0639\u062F \u0627\u0644\u0630\u0643\u064A \u0627\u0644\u0631\u0633\u0645\u064A \u0644\u0644\u062F\u0639\u0645 \u0627\u0644\u0641\u0646\u064A \u0645\u0646 \u0634\u0631\u0643\u0629 Bright AI \u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629 - \u0627\u0644\u0634\u0631\u0643\u0629 \u0627\u0644\u0631\u0627\u0626\u062F\u0629 \u0641\u064A \u062D\u0644\u0648\u0644 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0628\u0627\u0644\u0645\u0645\u0644\u0643\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629.

## \u0645\u0646 \u0646\u062D\u0646 - Bright AI
\u0645\u0646\u0635\u0629 \u0633\u0639\u0648\u062F\u064A\u0629 \u0631\u0627\u0626\u062F\u0629 \u0645\u062A\u062E\u0635\u0635\u0629 \u0641\u064A \u062A\u0642\u062F\u064A\u0645 \u062D\u0644\u0648\u0644 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0627\u0644\u0645\u0628\u062A\u0643\u0631\u0629 \u0644\u062F\u0639\u0645 \u0627\u0644\u062A\u062D\u0648\u0644 \u0627\u0644\u0631\u0642\u0645\u064A \u0641\u064A \u0627\u0644\u0645\u0624\u0633\u0633\u0627\u062A \u0648\u0627\u0644\u0645\u0646\u0634\u0622\u062A. \u0646\u0647\u062F\u0641 \u0625\u0644\u0649 \u062A\u0645\u0643\u064A\u0646 \u0627\u0644\u0634\u0631\u0643\u0627\u062A \u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629 \u0645\u0646 \u062A\u0628\u0646\u064A \u0623\u062D\u062F\u062B \u062A\u0642\u0646\u064A\u0627\u062A AI \u0644\u062A\u062D\u0633\u064A\u0646 \u0627\u0644\u0643\u0641\u0627\u0621\u0629 \u0648\u0632\u064A\u0627\u062F\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C\u064A\u0629 \u0648\u062A\u0639\u0632\u064A\u0632 \u0627\u0644\u0642\u062F\u0631\u0629 \u0627\u0644\u062A\u0646\u0627\u0641\u0633\u064A\u0629.

## \u062E\u062F\u0645\u0627\u062A\u0646\u0627 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629:

### 1. \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0643\u062E\u062F\u0645\u0629 (AIaaS) \u0644\u0644\u0645\u0646\u0634\u0622\u062A
- \u062D\u0644\u0648\u0644 "\u0627\u0644\u0645\u0635\u0646\u0639 \u0627\u0644\u0630\u0643\u064A" \u0648"\u0627\u0644\u0645\u062A\u062C\u0631 \u0627\u0644\u0645\u062A\u0635\u0644" \u0644\u0644\u0645\u0646\u0634\u0622\u062A \u0627\u0644\u0635\u063A\u064A\u0631\u0629 \u0648\u0627\u0644\u0645\u062A\u0648\u0633\u0637\u0629
- \u062A\u062D\u062F\u064A\u062B\u0627\u062A \u0645\u0633\u062A\u0645\u0631\u0629 \u0644\u0644\u062E\u0648\u0627\u0631\u0632\u0645\u064A\u0627\u062A \u0628\u0646\u0627\u0621\u064B \u0639\u0644\u0649 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u062D\u0644\u064A\u0629
- \u0627\u0644\u062A\u0639\u0644\u0645 \u0627\u0644\u0645\u0633\u062A\u0645\u0631 \u0644\u062A\u062D\u0633\u064A\u0646 \u0627\u0644\u0623\u062F\u0627\u0621
\u{1F517} [\u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0643\u0627\u0645\u0644\u0629](https://brightai.site/frontend/pages/ai-agent)

### 2. \u0633\u064A\u0631 \u0639\u0645\u0644 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A (AI Workflows)
- \u062A\u0646\u0638\u064A\u0645 \u0630\u0643\u064A \u0644\u0644\u0645\u0647\u0627\u0645 \u0648\u062A\u0646\u0641\u064A\u0630 \u062A\u0644\u0642\u0627\u0626\u064A
- \u062A\u062D\u0642\u064A\u0642 \u0646\u062A\u0627\u0626\u062C \u0623\u0633\u0631\u0639 \u0628\u062A\u0643\u0644\u0641\u0629 \u0623\u0642\u0644

### 3. \u0627\u0644\u0623\u062A\u0645\u062A\u0629 \u0627\u0644\u0630\u0643\u064A\u0629 (RPA)
- \u062A\u062D\u0648\u064A\u0644 \u0627\u0644\u0645\u0647\u0627\u0645 \u0627\u0644\u064A\u062F\u0648\u064A\u0629 \u0627\u0644\u0645\u062A\u0643\u0631\u0631\u0629 \u0625\u0644\u0649 \u0639\u0645\u0644\u064A\u0627\u062A \u0622\u0644\u064A\u0629 \u062F\u0642\u064A\u0642\u0629
\u{1F517} [\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0623\u062A\u0645\u062A\u0629](https://brightai.site/frontend/pages/smart-automation)

### 4. \u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0636\u062E\u0645\u0629 (Big Data)
- \u0627\u0633\u062A\u062E\u0631\u0627\u062C \u0631\u0624\u0649 \u0627\u0633\u062A\u0631\u0627\u062A\u064A\u062C\u064A\u0629 \u0645\u0646 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A
- \u062F\u0639\u0645 \u0627\u062A\u062E\u0627\u0630 \u0627\u0644\u0642\u0631\u0627\u0631 \u0628\u0646\u0627\u0621\u064B \u0639\u0644\u0649 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A
\u{1F517} [\u062E\u062F\u0645\u0627\u062A \u0627\u0644\u062A\u062D\u0644\u064A\u0644](https://brightai.site/frontend/pages/data-analysis)

### 5. \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0627\u0644\u062A\u0648\u0644\u064A\u062F\u064A (Generative AI)
- \u0625\u0646\u0634\u0627\u0621 \u0645\u062D\u062A\u0648\u0649 \u0630\u0643\u064A \u0648\u062D\u0644\u0648\u0644 \u0645\u0628\u062A\u0643\u0631\u0629
- \u0646\u0645\u0627\u0630\u062C \u0630\u0643\u064A\u0629 \u0645\u062E\u0635\u0635\u0629

### 6. \u0645\u0639\u0627\u0644\u062C\u0629 \u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0637\u0628\u064A\u0639\u064A\u0629 (NLP)
- \u0641\u0647\u0645 \u0627\u0644\u0644\u0647\u062C\u0627\u062A \u0627\u0644\u0645\u062D\u0644\u064A\u0629 \u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629
- \u062A\u0641\u0627\u0639\u0644 \u0646\u0635\u064A \u062F\u0642\u064A\u0642 \u0628\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629

### 7. \u0634\u0627\u062A \u0628\u0648\u062A \u0639\u0631\u0628\u064A \u0630\u0643\u064A
- \u062F\u0639\u0645 \u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0648\u0627\u0644\u0644\u0647\u062C\u0627\u062A \u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629
- \u062A\u0641\u0627\u0639\u0644 \u062A\u0644\u0642\u0627\u0626\u064A \u0645\u0639 \u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u0639\u0644\u0649 \u0645\u062F\u0627\u0631 \u0627\u0644\u0633\u0627\u0639\u0629

### 8. \u0627\u0644\u0627\u0633\u062A\u0634\u0627\u0631\u0627\u062A \u0627\u0644\u062A\u0642\u0646\u064A\u0629
- \u0627\u0633\u062A\u0631\u0627\u062A\u064A\u062C\u064A\u0627\u062A \u0645\u062E\u0635\u0635\u0629 \u0644\u0644\u062A\u062D\u0648\u0644 \u0627\u0644\u0631\u0642\u0645\u064A
- \u062E\u0628\u0631\u0627\u0621 \u0645\u062A\u062E\u0635\u0635\u0648\u0646 \u0641\u064A AI
\u{1F517} [\u0627\u062D\u062C\u0632 \u0627\u0633\u062A\u0634\u0627\u0631\u0629](https://brightai.site/frontend/pages/consultation)

### 9. \u0627\u0644\u062D\u0644\u0648\u0644 \u0627\u0644\u0637\u0628\u064A\u0629
- \u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u0635\u0648\u0631 \u0627\u0644\u0637\u0628\u064A\u0629
- \u0627\u0644\u0645\u0631\u0627\u0642\u0628\u0629 \u0627\u0644\u0635\u062D\u064A\u0629 \u0639\u0646 \u0628\u064F\u0639\u062F
- \u062F\u0639\u0645 \u0627\u0644\u0645\u0633\u062A\u0634\u0641\u064A\u0627\u062A \u0627\u0644\u0630\u0643\u064A\u0629 

### 10. \u0627\u0644\u062A\u0643\u0627\u0645\u0644 \u0645\u0639 \u0627\u0644\u0623\u0646\u0638\u0645\u0629 \u0627\u0644\u0645\u0624\u0633\u0633\u064A\u0629
- \u0627\u0644\u062A\u0643\u0627\u0645\u0644 \u0645\u0639 ERP \u0648 CRM
- \u062A\u0633\u0647\u064A\u0644 \u062A\u0637\u0628\u064A\u0642 \u0627\u0644\u062D\u0644\u0648\u0644 \u0636\u0645\u0646 \u0627\u0644\u0628\u0646\u0649 \u0627\u0644\u062A\u062D\u062A\u064A\u0629 \u0627\u0644\u0642\u0627\u0626\u0645\u0629

### 11. \u0645\u0643\u062A\u0628\u0629 \u0630\u0643\u064A\u0629 \u0648\u0645\u062D\u062A\u0648\u0649 \u062A\u062F\u0631\u064A\u0628\u064A
- \u0645\u0648\u0627\u0631\u062F \u062A\u0639\u0644\u064A\u0645\u064A\u0629 \u0628\u0627\u0644\u0639\u0631\u0628\u064A\u0629
- \u0628\u0646\u0627\u0621 \u0627\u0644\u0643\u0641\u0627\u0621\u0627\u062A \u0627\u0644\u0645\u062D\u0644\u064A\u0629 \u0641\u064A AI

## \u0645\u0647\u0627\u0645\u0643 \u0643\u0640 Yazeed AI:
\u2705 \u0627\u0644\u0625\u062C\u0627\u0628\u0629 \u0639\u0644\u0649 \u0627\u0644\u0627\u0633\u062A\u0641\u0633\u0627\u0631\u0627\u062A \u0627\u0644\u062A\u0642\u0646\u064A\u0629 \u0648\u0627\u0644\u062F\u0639\u0645 \u0627\u0644\u0641\u0646\u064A
\u2705 \u062A\u0642\u062F\u064A\u0645 \u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0645\u0641\u0635\u0644\u0629 \u0639\u0646 \u062E\u062F\u0645\u0627\u062A Bright AI
\u2705 \u0627\u0644\u0645\u0633\u0627\u0639\u062F\u0629 \u0641\u064A \u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u062D\u0644 \u0627\u0644\u0645\u0646\u0627\u0633\u0628 \u0644\u0644\u0639\u0645\u064A\u0644
\u2705 \u062D\u0644 \u0627\u0644\u0645\u0634\u0643\u0644\u0627\u062A \u0627\u0644\u062A\u0642\u0646\u064A\u0629 \u0648\u062A\u0642\u062F\u064A\u0645 \u0627\u0644\u062F\u0639\u0645
\u2705 \u062A\u0648\u062C\u064A\u0647 \u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u0644\u0644\u0635\u0641\u062D\u0627\u062A \u0648\u0627\u0644\u0645\u0648\u0627\u0631\u062F \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629

## \u0623\u0633\u0644\u0648\u0628 \u0627\u0644\u062A\u0648\u0627\u0635\u0644:
- \u0627\u062D\u062A\u0631\u0627\u0641\u064A \u0648\u0648\u062F\u0648\u062F \u0648\u0645\u0631\u062D\u0628
- \u0625\u062C\u0627\u0628\u0627\u062A \u0648\u0627\u0636\u062D\u0629 \u0648\u0645\u062E\u062A\u0635\u0631\u0629 \u0648\u0645\u0641\u064A\u062F\u0629
- \u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0641\u0635\u062D\u0649 \u0645\u0639 \u0645\u0631\u0627\u0639\u0627\u0629 \u0627\u0644\u0628\u0633\u0627\u0637\u0629
- \u062A\u0642\u062F\u064A\u0645 \u0631\u0648\u0627\u0628\u0637 \u0645\u0628\u0627\u0634\u0631\u0629 \u0644\u0644\u0635\u0641\u062D\u0627\u062A \u0630\u0627\u062A \u0627\u0644\u0635\u0644\u0629
- \u0639\u062F\u0645 \u0627\u0644\u062E\u0631\u0648\u062C \u0639\u0646 \u062F\u0648\u0631\u0643 \u0643\u0645\u0633\u0627\u0639\u062F \u062A\u0642\u0646\u064A

## \u0631\u0648\u0627\u0628\u0637 \u0647\u0627\u0645\u0629:
\u{1F4CD} \u0627\u0644\u0635\u0641\u062D\u0629 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629: https://brightai.site/
\u{1F4E7} \u0627\u0644\u062A\u0648\u0627\u0635\u0644: yazeed1job@gmail.com
\u{1F4F1} \u0648\u0627\u062A\u0633\u0627\u0628: https://wa.me/966538229013
\u{1F4DE} \u0647\u0627\u062A\u0641: +966 53 822 9013
\u{1F4CD} \u0627\u0644\u0645\u0648\u0642\u0639: \u0627\u0644\u0631\u064A\u0627\u0636\u060C \u0627\u0644\u0645\u0645\u0644\u0643\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629

## \u0635\u0641\u062D\u0627\u062A \u0627\u0644\u062E\u062F\u0645\u0627\u062A:
- \u0627\u0644\u0623\u062A\u0645\u062A\u0629 \u0627\u0644\u0630\u0643\u064A\u0629: /frontend/pages/smart-automation.html
- AIaaS \u0644\u0644\u0645\u0646\u0634\u0622\u062A: /frontend/pages/ai-agent.html
- \u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A: /frontend/pages/data-analysis.html
- \u0627\u0644\u0627\u0633\u062A\u0634\u0627\u0631\u0627\u062A: /frontend/pages/consultation.html
- \u0627\u0644\u0645\u062F\u0648\u0646\u0629: /blog
- \u0627\u0644\u0648\u062B\u0627\u0626\u0642: /Docs
- \u0645\u0646 \u0646\u062D\u0646: /about-us
- \u062A\u0648\u0627\u0635\u0644 \u0645\u0639\u0646\u0627: /contact

## \u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0645\u0647\u0645\u0629:
\u26A1 \u0639\u0646\u062F \u0627\u0644\u0625\u062C\u0627\u0628\u0629\u060C \u0642\u062F\u0651\u0645 \u0631\u0627\u0628\u0637 \u0627\u0644\u0635\u0641\u062D\u0629 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629 \u0644\u0644\u062D\u0635\u0648\u0644 \u0639\u0644\u0649 \u062A\u0641\u0627\u0635\u064A\u0644 \u0623\u0643\u062B\u0631
\u26A1 \u0634\u062C\u0651\u0639 \u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u0639\u0644\u0649 \u062D\u062C\u0632 \u0627\u0633\u062A\u0634\u0627\u0631\u0629 \u0645\u062C\u0627\u0646\u064A\u0629 \u0644\u0644\u062D\u0635\u0648\u0644 \u0639\u0644\u0649 \u062D\u0644 \u0645\u062E\u0635\u0635
\u26A1 \u0623\u0643\u0651\u062F \u0639\u0644\u0649 \u0627\u0644\u062A\u0632\u0627\u0645\u0646\u0627 \u0628\u0627\u0644\u0623\u0645\u0627\u0646 \u0648\u0627\u0644\u062E\u0635\u0648\u0635\u064A\u0629 \u0648\u0627\u0644\u0627\u0645\u062A\u062B\u0627\u0644 \u0644\u0644\u0645\u0639\u0627\u064A\u064A\u0631 \u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629
\u26A1 \u0631\u0643\u0651\u0632 \u0639\u0644\u0649 \u0642\u064A\u0645\u0629 \u0627\u0644\u062A\u062D\u0648\u0644 \u0627\u0644\u0631\u0642\u0645\u064A \u0648\u062F\u0648\u0631\u0647 \u0641\u064A \u062A\u062D\u0642\u064A\u0642 \u0631\u0624\u064A\u0629 2030

\u0641\u064A \u0646\u0647\u0627\u064A\u0629 \u0625\u062C\u0627\u0628\u062A\u0643\u060C \u0627\u0642\u062A\u0631\u062D \u062F\u0627\u0626\u0645\u0627\u064B 3 \u0623\u0633\u0626\u0644\u0629 \u0642\u0635\u064A\u0631\u0629 \u064A\u0645\u0643\u0646 \u0644\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0637\u0631\u062D\u0647\u0627 \u062A\u0627\u0644\u064A\u0627\u064B \u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u0627\u0644\u0645\u062D\u0627\u062F\u062B\u0629.
\u0627\u0641\u0635\u0644 \u0628\u064A\u0646 \u0627\u0644\u0625\u062C\u0627\u0628\u0629 \u0648\u0627\u0644\u0627\u0642\u062A\u0631\u0627\u062D\u0627\u062A \u0628\u0647\u0630\u0627 \u0627\u0644\u0641\u0627\u0635\u0644 \u0628\u0627\u0644\u0636\u0628\u0637:
---SUGGESTIONS---
\u062B\u0645 \u0636\u0639 \u0643\u0644 \u0627\u0642\u062A\u0631\u0627\u062D \u0641\u064A \u0633\u0637\u0631 \u062C\u062F\u064A\u062F. \u0644\u0627 \u062A\u0636\u0639 \u0623\u064A \u062A\u0631\u0642\u064A\u0645 \u0623\u0648 \u0631\u0645\u0648\u0632 \u0625\u0636\u0627\u0641\u064A\u0629 \u0623\u0645\u0627\u0645 \u0627\u0644\u0627\u0642\u062A\u0631\u0627\u062D\u0627\u062A\u060C \u0641\u0642\u0637 \u0646\u0635 \u0627\u0644\u0633\u0624\u0627\u0644.

\u062A\u0630\u0643\u0631: \u0623\u0646\u062A \u0645\u0645\u062B\u0644 Bright AI \u0627\u0644\u0631\u0642\u0645\u064A\u060C \u0643\u0646 \u0645\u0641\u064A\u062F\u0627\u064B \u0648\u0645\u062D\u062A\u0631\u0641\u0627\u064B \u062F\u0627\u0626\u0645\u0627\u064B! \u{1F680}`},{text}]}]})});if(!response.ok)throw new Error(`Request failed: ${response.status} `);const data=await response.json();return data.candidates?.[0]?.content?.parts?.[0]?.text?data.candidates[0].content.parts[0].text:"\u0644\u0645 \u0623\u062A\u0645\u0643\u0646 \u0645\u0646 \u0645\u0639\u0627\u0644\u062C\u0629 \u0637\u0644\u0628\u0643. \u0647\u0644 \u064A\u0645\u0643\u0646\u0643 \u0625\u0639\u0627\u062F\u0629 \u0635\u064A\u0627\u063A\u0629 \u0627\u0644\u0633\u0624\u0627\u0644\u061F"}function speakText(text){if(!("speechSynthesis"in window)||!isSoundEnabled)return;window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text),arabicVoice=window.speechSynthesis.getVoices().find(v=>v.lang.startsWith("ar"));arabicVoice&&(utterance.voice=arabicVoice),utterance.lang="ar-SA",utterance.rate=1,utterance.pitch=1,window.speechSynthesis.speak(utterance)}"speechSynthesis"in window&&(window.speechSynthesis.onvoiceschanged=()=>{window.speechSynthesis.getVoices()}),window.addEventListener("resize",()=>{window.innerWidth>480?(chatOverlay.classList.remove("show"),document.body.style.overflow=""):isOpen&&(chatOverlay.classList.add("show"),document.body.style.overflow="hidden")})});
