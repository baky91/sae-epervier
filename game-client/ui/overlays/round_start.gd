extends Control

@onready var label_number: Label = $LabelNumber

func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)

func set_time(value: int):
	var is_last_tick = (value == 0)
	
	if not is_last_tick:
		label_number.text = str(value)
	else:
		label_number.text = "CHASSEZ !"
	
	scale_label_effect(is_last_tick)

func scale_label_effect(destroy_at_end):
	# Effet de pulse / impact
	label_number.scale = Vector2(1.8, 1.8) # Un peu plus grand pour plus d'impact !
	
	var tween = create_tween()
	tween.tween_property(
		label_number, 
		"scale", 
		Vector2(1.0, 1.0), 
		0.3
	).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	
	if destroy_at_end:
		# On attend la fin des 0.3s du tween, puis on supprime l'overlay
		tween.finished.connect(func(): queue_free())
		Globals.inputs_blocked = false
