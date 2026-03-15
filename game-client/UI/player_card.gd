extends Node

signal remove_player_on_lobby(id: int)

var id: int

@export var label_num: Label
@export var label_name: Label

func set_text(num, p_name: String):
	id = num
	label_num.text += str(num)
	label_name.text = p_name

func _on_button_remove_player_pressed() -> void:
	remove_player_on_lobby.emit(id)
