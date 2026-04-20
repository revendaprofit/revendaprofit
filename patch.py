import re

with open("src/pages/SalesHistory.tsx", "r", encoding="utf-8") as f:
    content = f.read()

pattern = r'<div className="bg-card border rounded-xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">\s*<div className="bg-rose-100 text-rose-600 p-3 rounded-full"><Banknote className="h-6 w-6"/></div>\s*<div>\s*<p className="text-\[10px\] text-muted-foreground font-semibold uppercase tracking-wider">Total Custos</p>\s*<p className="text-2xl font-black text-rose-600 truncate">R\$ {sumCustos.toFixed\(2\)}</p>\s*</div>\s*</div>\s*<div className="bg-card border rounded-xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">\s*<div className="bg-blue-100 text-blue-600 p-3 rounded-full"><Banknote className="h-6 w-6"/></div>\s*<div>\s*<p className="text-\[10px\] text-muted-foreground font-semibold uppercase tracking-wider">Lucro Bruto</p>\s*<p className="text-2xl font-black text-blue-600 truncate">R\$ {sumLucro.toFixed\(2\)}</p>\s*</div>\s*</div>'

repl = """<div className="bg-card border rounded-xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
            <div className="bg-blue-100 text-blue-600 p-3 rounded-full"><Banknote className="h-6 w-6"/></div>
            <div>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Lucro Líquido</p>
              <p className="text-2xl font-black text-blue-600 truncate">R$ {sumLucroLiquido.toFixed(2)}</p>
            </div>
          </div>
          <div className="bg-card border rounded-xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
            <div className="bg-purple-100 text-purple-600 p-3 rounded-full"><Banknote className="h-6 w-6"/></div>
            <div>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Margem de Lucro</p>
              <p className="text-2xl font-black text-purple-600 truncate">{margemLucro.toFixed(2)}%</p>
            </div>
          </div>"""

content = re.sub(pattern, lambda m: repl, content, flags=re.DOTALL)

with open("src/pages/SalesHistory.tsx", "w", encoding="utf-8") as f:
    f.write(content)
