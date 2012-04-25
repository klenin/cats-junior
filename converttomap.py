f = open('problem4.json')
res = '['
str = f.readline()
while(str != ''):
	res += '['
	for i, ch in enumerate(str):
		if ch == '\n':
			break
		if i:
			res += ', '
		res += '"' + ch + '"' 
	res += ']'
	str = f.readline()
	if str != '':
		res += ',\n'
res += ']'
print res
