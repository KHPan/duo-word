import json
import random
import time

combo = ComboBox()
question = Label()
anss = [Button() for _ in range(4)]
keys = "DFJK"
for a, k in zip(anss, keys):
	a.linkToKey(k)

def start():
	global combo, question, anss, file_map
	with open('file-map.json', 'r', encoding='utf-8') as f:
		file_map = json.load(f)
	for key in file_map.keys():
		combo.addItem(key)
	question.unshow()
	for a in anss:
		a.unshow()
	combo.show()
	wait_for_select_combo()

def after_select_combo():
	global combo, question, anss, file_map, until_index
	file = file_map[combo.currentText()]
	with open(file, 'r', encoding='utf-8') as f:
		data = json.load(f)
	random.shuffle(data)
	combo.unshow()
	question.show()
	for a in anss:
		a.show()
	ques = []
	for i in range(4):
		anss[i].setText(data[i][1])
		ques.append(data[i][0])
	until_index = 4
	question.setText(ques[random.randint(0, 3)])
	wait_for_select_anss()

def after_select_anss(index: int):
	global until_index, data, question, anss, ques
	if question.text() == ques[index]:
		anss[index].setText(data[until_index][1])
		ques[index] = data[until_index][0]
		until_index += 1
		if until_index == len(data):
			until_index = 0
			msgBox("恭喜完成一輪")
		question.setText(ques[random.randint(0, 3)])
	else:
		question.setTextColor('red')
		time.sleep(0.1)
		question.setTextColor('black')
		question.setText([q != question.text() for q in ques
								][random.randint(0, 2)])
	wait_for_select_anss()