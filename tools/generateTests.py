TESTS_NUM = 55;

out = open('generatedTests.js', 'w')
out.write('TESTS_NUM = %s;\n' % TESTS_NUM)
out.write('tests = [];\n')

for i in range(1, TESTS_NUM + 1):
	input = open('tests/t%03d.in' % i, 'r')
	s = input.readline()
	res = ""
	while(len(s)):
		res += s.replace("\n", "").replace('"', "\"") + '\\n'
		s = input.readline()
	out.write('tests.push("%s");\n' % res)
	input.close()
	
out.close()
