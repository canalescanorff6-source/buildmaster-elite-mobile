import {Copy} from 'lucide-react';
import type {AnalysisResult} from '@/lib/analyzerDomain';
import {cardChatContext} from '@/lib/cardChatContext';
export function CardChatConsultation({result,onMessage}:{result:AnalysisResult;onMessage:(message:string)=>void}){
const fallback='Selecione e copie o texto acima para consultar no ChatGPT.';
return(<details className="result-chat-consultation">
<summary>Consultar esta carta no ChatGPT</summary>
<p>Copie os dados e cole em uma nova conversa. A consulta usa o ChatGPT fora do app.</p>
<textarea aria-label="Contexto desta carta para o ChatGPT" readOnly value={cardChatContext(result)} rows={4} />
<button type="button" onClick={()=>{if(!navigator.clipboard){onMessage(fallback);return}void navigator.clipboard.writeText(cardChatContext(result)).then(()=>onMessage('Dados desta carta copiados. Cole em uma nova conversa no ChatGPT.')).catch(()=>onMessage(fallback))}}><Copy size={17}/> Copiar dados da carta</button>
<a href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">Abrir ChatGPT</a>
</details>);
}
