extends  Node

@export var label_num: Label
@export var label_name: Label

func set_text(num, p_name: String):
	label_num.text += str(num)
	label_name.text = p_name
