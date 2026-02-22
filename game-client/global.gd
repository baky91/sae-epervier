extends Node

var host_code: String

func _ready() -> void:
	host_code = _generate_random_code()
	print("Code de partie généré : ", host_code)

func _generate_random_code():
	var rng = RandomNumberGenerator.new()
	var code = ""
	var code_length = 4
	var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
	var characters_length = characters.length()
	
	for i in range(code_length):
		var random_index = rng.randi_range(0, characters_length - 1)
		code += characters[random_index]
		
	return code
