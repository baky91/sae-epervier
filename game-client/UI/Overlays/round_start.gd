extends Control

@onready var label_number: Label = $LabelNumber
var current_time: int = 3

# Called when the node enters the scene tree for the first time.
func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_update_display()

func set_time(value: int):
	current_time = value
	_update_display()

func _update_display():
	if current_time > 0:
		label_number.text = str(current_time)
		# Petite animation de zoom pour donner du dynamisme (Juiciness)
		scale_label_effect()
	else:
		label_number.text = "CHASSEZ !"

func scale_label_effect():
	# Crée un effet de "pulse" à chaque seconde
	label_number.scale = Vector2(1.5, 1.5)
	label_number.pivot_offset = label_number.size / 2
	var tween = create_tween()
	tween.tween_property(label_number, "scale", Vector2(1.0, 1.0), 0.3).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
