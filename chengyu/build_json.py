import re, json
from pathlib import Path
src=Path('/tmp/up_utf8.txt').read_text(encoding='utf-8')
# Cut exactly groups 1-4, before group 5
start=src.index('【第一组】中华文明传统文化（5 个）')
end=src.index('【第五组】守旧不创新（6 个）')
text=src[start:end]
# First occurrence of each entry marker in the body; strip page headers and question sections by stopping at 4.2
text=text[:text.index('4.2 真题示例')]
blocks=re.split(r'✎', text)[1:]
entries=[]
for b in blocks:
    b=re.sub(r'第\s*\d+\s*页','',b)
    b=' '.join(x.strip() for x in b.splitlines())
    b=re.sub(r'\s+',' ',b).strip()
    if not b: continue
    name=b.split(' ',1)[0]
    if not re.match(r'^[\u4e00-\u9fff]{4}$',name): continue
    # split at first example marker
    parts=b.split('【例】',1)
    explanation=parts[0].strip()
    examples=[]
    if len(parts)>1:
        examples=[' '.join(x.strip().split()) for x in parts[1].split('【例】') if x.strip()]
    # infer group from nearest heading in preceding text is handled below
    entries.append({'成语':name,'解释':explanation,'完整例句':examples})
# remove duplicates caused by repeated headings / retain order
seen=set(); uniq=[]
for e in entries:
    if e['成语'] not in seen:
        seen.add(e['成语']); uniq.append(e)
entries=uniq
mem={
'源远流长':'想象一条从遥远源头奔流到今天的大河：历史越久，河流越长。','连绵不绝':'像一条没有断点的长绳，连续不断。','博大精深':'“博大”是面积广，“精深”是钻得深：既广又深。','历久弥新':'时间越久反而越新鲜，像陈年老酒越放越有味。','兼收并蓄':'像一个大海纳百川：不同内容都能吸收保存。','一脉相承':'一条血脉一路传下来，强调传承关系。','血脉相通':'血管彼此相连，借指关系亲近、联系密切。','薪火相传':'前人递火给后人，知识技艺代代不断。','不绝如缕':'像一根细线似断非断；记作“险而不断”。','陈陈相因':'仓库里的陈米一袋接一袋，借指沿袭旧套、没有改进。','口耳相传':'嘴说、耳听，一传十十传百。','难以为继':'后面的路接不上了，事情难以继续。','后继无人':'接班的队伍断了，事业没人继承。','继往开来':'接过前人的接力棒，再跑向未来。','承上启下':'像桥梁：承接上文，又引出下文。','推陈出新':'把旧东西筛掉，把新东西推出来。','吐故纳新':'呼出旧空气、吸入新空气；扬弃旧的、吸收新的。','革故鼎新':'把旧制度革掉，像立鼎一样建立新的，常指重大变革。','弃旧图新':'转身离开旧路，重新谋划更好的新路。','去芜存菁':'像除草挑金：去掉杂质，只留下精华。','除旧布新':'清除旧的，布置新的，以新代旧。','激浊扬清':'一手冲走浑浊，一手扬起清流；清除坏的、弘扬好的。','去伪存真':'戴上“鉴真眼镜”，排除假的，留下真的。','另辟蹊径':'不挤老路，另开一条小路，寻找新方法。','标新立异':'故意举起“新奇旗帜”，提出与众不同的见解，可能含贬义。','与时俱进':'和时间一起向前走，不停滞。','剑走偏锋':'剑不走正中，走旁边奇路；用非常规办法出奇制胜。','不拘一格':'不被一种规格绑住，打破常规。','别具一格':'别人都有一种风格，你偏偏另有一格，独特而不同。','空前绝后':'前面没有、后面也难再有，形容独一无二或成就非凡。','举世无双':'全世界找不到第二个，极其稀有或优秀。','匠心独运':'匠人般巧用心思，创作构思特别精巧。','别出心裁':'心里另想一招，办法巧妙而不同。','异想天开':'想象飞到天外，想法离奇，未必现实。','独树一帜':'单独竖起自己的旗帜，形成独特风格。','自成一家':'有独到见解，形成自己的体系。','别开生面':'另开一个新面貌、新局面。','不落窠臼':'不掉进旧套子，作品有独创风格。','特立独行':'坚持自己的立场，独立行事，不随俗。'}
# assign groups according to source ordering
ranges=[('第一组：中华文明传统文化',0,5),('第二组：文化传承',5,15),('第三组：改革创新',15,23),('第四组：做法、构思创新',23,39)]
out=[]
for g,a,b in ranges:
    items=[]
    for e in entries[a:b]:
        e['记忆方法']=mem.get(e['成语'],'抓住字面画面记忆：先想象，再联系含义。')
        items.append(e)
    out.append({'组别':g,'成语数量':len(items),'词条':items})
Path('第一至四组成语.json').write_text(json.dumps({'来源':'（上册）【四海】-高频成语实词1000词.pdf','说明':'解释与完整例句依据 PDF 提取文本；记忆方法为辅助记忆补充。','分组':out},ensure_ascii=False,indent=2),encoding='utf-8')
print('entries',len(entries), 'groups', [len(x['词条']) for x in out])
