extends Control

@onready var label_number: Label = $LabelNumber

func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)

func set_time(value: int):
	if value > 0:
		label_number.text = str(value)
	else:
		label_number.text = "CHASSEZ !"
	
	# On lance l'effet visuel à chaque fois que le texte change
	scale_label_effect()

func scale_label_effect():
	# Effet de pulse / impact
	label_number.scale = Vector2(1.8, 1.8) # Un peu plus grand pour plus d'impact !
	
	var tween = create_tween()
	tween.tween_property(
		label_number, 
		"scale", 
		Vector2(1.0, 1.0), 
		0.3
	).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
