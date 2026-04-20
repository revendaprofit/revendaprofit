import re
with open("src/pages/POS.tsx", "r", encoding="utf-8") as f:
    content = f.read()

repl = """<div className="flex gap-2">
                  <Button onClick={() => { if (releaseTicketUrl) { navigator.clipboard.writeText(releaseTicketUrl); toast.success("Link copiado!"); } }} variant="outline" className="h-12 font-bold flex-1 border-slate-300">Copiar</Button>
                  <Button onClick={() => { let phoneStr = releaseTicketCustomerPhone.replace(/\\D/g, ''); if (phoneStr && phoneStr.length < 12 && phoneStr.length >= 10) phoneStr = '55' + phoneStr; const text = `Oi ${releaseTicketCustomerName ? releaseTicketCustomerName.split(' ')[0] : 'Cliente'}! Pagamento recebido com sucesso ✅\\n\\nAqui está o seu Passe de Liberação Digital.\\nApresente esta tela na recepção para retirar suas peças:\\n${releaseTicketUrl}`; const url = phoneStr ? `https://wa.me/${phoneStr}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`; window.open(url, '_blank'); }} className="h-12 font-bold text-base flex-[2.5] bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-[0_5px_15px_rgba(5,150,105,0.4)] transition-all hover:scale-[1.02]">Enviar no WhatsApp</Button>
                </div>"""

content = re.sub(r'<Button[^>]+Copiar Passe Seguro\s*</Button>', lambda m: repl, content, flags=re.DOTALL)

with open("src/pages/POS.tsx", "w", encoding="utf-8") as f:
    f.write(content)
