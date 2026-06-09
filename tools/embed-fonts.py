#!/usr/bin/env python3
# Embed every fonts/<Family>-<weight>.woff2 as a base64 @font-face, injected between
# the /* FONTS:START */ and /* FONTS:END */ markers in emergence.html. Idempotent.
import base64, glob, os, re, sys
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
html=os.path.join(ROOT,'emergence.html')
blocks=[]
for f in sorted(glob.glob(os.path.join(ROOT,'fonts','*.woff2'))):
    name=os.path.basename(f)[:-6]          # Family-weight
    fam,wt=name.rsplit('-',1)
    fam=fam.replace('_',' ')
    b64=base64.b64encode(open(f,'rb').read()).decode()
    blocks.append("  @font-face{font-family:'%s';font-style:normal;font-weight:%s;font-display:swap;"
                  "src:url(data:font/woff2;base64,%s) format('woff2');}"%(fam,wt,b64))
    print('embedded %s %s (%d B woff2)'%(fam,wt,os.path.getsize(f)))
payload="  /* FONTS:START */\n"+"\n".join(blocks)+"\n  /* FONTS:END */"
src=open(html).read()
new=re.sub(r"  /\* FONTS:START \*/.*?  /\* FONTS:END \*/", lambda m: payload, src, count=1, flags=re.S)
open(html,'w').write(new)
print('injected %d @font-face block(s)'%len(blocks))
