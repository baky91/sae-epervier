class_name Player extends CharacterBody2D

signal get_bonus(player_id: int, bonus_name: String)
signal role_changed(player_id: int, role: String)

const ROLE_SURVIVOR = "survivor"
const ROLE_INFECTED = "infected"
const ROLE_SPARROWHAWK = "sparrowhawk"

const ROLES_CONFIG = {
	ROLE_SURVIVOR: Color(0.231, 0.51, 0.965, 1.0),
	ROLE_INFECTED: Color(0.612, 0.639, 0.686, 1.0),
	ROLE_SPARROWHAWK: Color(0.937, 0.267, 0.267, 1.0)
}

@onready var timer_dash = $TimerDash
@onready var timer_speed_boost = $TimerSpeedBoost

var id: int
var speed: int = 300
var dash_speed: int = 600
var direction: Vector2 = Vector2.ZERO
var role: String
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

func _physics_process(delta: float) -> void:
	if role != ROLE_INFECTED:
		if dashing:
			velocity = direction * dash_speed
		elif speed_boosting:
			velocity = direction * speed * 1.5
		else:
			velocity = direction * speed
		
		var collision = move_and_collide(velocity * delta)
		
		if collision:
			var collider = collision.get_collider()
			if collider is Player:
				if role == ROLE_SURVIVOR and collider.role == ROLE_SPARROWHAWK:
					# Le joueur actuel devient infecté
					print("Joueur " + str(id) + " : je suis survivant et j'ai touché un épervier")
					role_changed.emit(id, ROLE_INFECTED)
				elif role == ROLE_SPARROWHAWK and collider.role == ROLE_SURVIVOR:
					# Le joueur cible devient infecté
					print("Joueur " + str(id) + " : je suis épervier et j'ai touché un survivant")
					collider.role_changed.emit(collider.id, ROLE_INFECTED)

func set_role(new_role: String):
	role = new_role
	set_color(ROLES_CONFIG[role])
	if role == ROLE_INFECTED:
		$CollisionShape2D.disabled = true
	else:
		$CollisionShape2D.disabled = false
		
func set_color(color: Color):
	$MeshInstance2D.modulate = color
	
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
