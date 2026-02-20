extends CharacterBody2D

signal get_bonus(player_id: int, bonus_name: String)

const COLOR_BLUE = Color(0.231, 0.51, 0.965, 1.0)  # Survivant
const COLOR_GRAY = Color(0.612, 0.639, 0.686, 1.0) # Infecté
const COLOR_RED = Color(0.937, 0.267, 0.267, 1.0)  # Epervier

var timer_dash: Timer
var timer_speed_boost: Timer

enum Role {
	SURVIVOR,
	INFECTED,
	SPARROWHAWK
}

var id: int
var speed: int = 300
var dash_speed: int = 600
var direction: Vector2 = Vector2.ZERO
var role: Role
var bonus: Dictionary = {
	"speed": 0,
	"dash": 0
}

# Bonus activated
var dashing = false
var speed_boosting = false

# Bonus can be use
var can_dash = true
var can_speed_boost = true

func _ready():
	timer_dash = $TimerDash
	timer_speed_boost = $TimerSpeedBoost

func _physics_process(_delta: float) -> void:
	if dashing:
		velocity = direction * dash_speed
	elif speed_boosting:
		velocity = direction * speed * 1.5
	else:
		velocity = direction * speed
		
	move_and_slide()

func set_color(color: Color):
	MeshInstance2D.mesh.material.albedo_color = color

func set_label(text: String):
	$LabelNumber.text = text
	
func add_bonus(bonus_name: String):
	if bonus.has(bonus_name):
		bonus[bonus_name] += 1
		get_bonus.emit(id, bonus_name)
		print("Player " + str(id) + " : Bonus " + bonus_name + " added.")

func _on_timer_dash_timeout() -> void:
	print("end dash")
	dashing = false

func _on_timer_dash_cooldown_timeout() -> void:
	can_dash = true

func _on_timer_speed_boost_timeout() -> void:
	speed_boosting = false
