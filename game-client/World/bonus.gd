class_name Bonus extends Area2D

var BONUS_LIST = ["speed", "dash"]

var bonus_name: String

func _ready() -> void:
	# Random Bonus
	bonus_name = BONUS_LIST.pick_random()
	var path = "res://Assets/bonus-" + bonus_name + ".png"
	$Sprite2D.texture = load(path)
	
	# Random Position
	var rng = RandomNumberGenerator.new()
	
	var width = get_viewport().get_visible_rect().size[0]
	var height = get_viewport().get_visible_rect().size[1]
	
	var random_x = rng.randi_range(0, width)
	var random_y = rng.randi_range(40, height - 40)

	position = Vector2(random_x, random_y)

func _on_body_entered(body: Node2D) -> void:
	body.add_bonus(bonus_name)
	# Supprimer le bonus une fois qu'il a été récupéré
	queue_free()
