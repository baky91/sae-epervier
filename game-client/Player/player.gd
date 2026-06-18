class_name Player extends CharacterBody2D

signal get_bonus(player_id: int, bonus_name: String)
signal role_changed(player_id: int, role: String)
signal player_infected(sparrowhawk_id: int, infected_id: int)

const ROLE_SURVIVOR = "survivor"
const ROLE_INFECTED = "infected"
const ROLE_SPARROWHAWK = "sparrowhawk"

#const GROUP_SURVIVORS = "survivors"
#const GROUP_INFECTED = "infected"
#const GROUP_SPARROWHAWKS = "sparrowhawks"

const ROLES_CONFIG = {
	ROLE_SURVIVOR: Color(0.231, 0.51, 0.965, 1.0),
	ROLE_INFECTED: Color(0.612, 0.639, 0.686, 1.0),
	ROLE_SPARROWHAWK: Color(0.937, 0.267, 0.267, 1.0)
}

@onready var timer_dash = $TimerDash
@onready var timer_speed_boost = $TimerSpeedBoost
@export var players_collisions: Area2D
@onready var label_name: Label = $LabelName
@onready var label_number: Label = $LabelNumber

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

# If the player is in the 
var is_safe = false

func _physics_process(_delta: float) -> void:
	if role != ROLE_INFECTED:
		if dashing:
			velocity = direction * dash_speed
		elif speed_boosting:
			velocity = direction * speed * 1.5
		else:
			velocity = direction * speed
		
		move_and_slide()

func set_role(new_role: String):
	role = new_role
	set_color(ROLES_CONFIG[role])
	
	## Définition du bon groupe
	#match role:
		#ROLE_SURVIVOR:
			#add_to_group(GROUP_SURVIVORS)
			#remove_from_group(GROUP_INFECTED)
			#remove_from_group(GROUP_SPARROWHAWKS)
		#ROLE_INFECTED:
			#remove_from_group(GROUP_SURVIVORS)
			#add_to_group(GROUP_INFECTED)
			#remove_from_group(GROUP_SPARROWHAWKS)
		#ROLE_SPARROWHAWK:
			#remove_from_group(GROUP_SURVIVORS)
			#remove_from_group(GROUP_INFECTED)
			#add_to_group(GROUP_SPARROWHAWKS)
	
	if role == ROLE_INFECTED:
		$Area2D/CollisionShape2D.set_deferred("disabled", true)
	else:
		$Area2D/CollisionShape2D.set_deferred("disabled", false)
		
	if role == ROLE_SPARROWHAWK:
		# Mettre le 4ème bit (Sparrowhawk) à 1
		collision_layer = collision_layer | 0x0008
		
		# Mettre le 5ème bit (SafeZoneLine) à 1
		collision_mask = collision_mask | 0x0010
		
func set_color(color: Color):
	$MeshInstance2D.modulate = color
	
func set_label_num_text(number: String):
	label_number.text = number

func set_label_name_text(p_name: String):
	label_name.text = p_name

func add_bonus(bonus_name: String):
	if bonus.has(bonus_name):
		bonus[bonus_name] += 1
		get_bonus.emit(id, bonus_name)
		#print("Player " + str(id) + " : Bonus " + bonus_name + " added.")

func _on_timer_dash_timeout() -> void:
	#print("end dash")
	dashing = false

func _on_timer_dash_cooldown_timeout() -> void:
	can_dash = true

func _on_timer_speed_boost_timeout() -> void:
	speed_boosting = false

func _on_area_2d_body_entered(body: Node2D) -> void:
	if body is Player:
		if role == ROLE_SURVIVOR and body.role == ROLE_SPARROWHAWK:
			# Le joueur actuel devient infecté
			#print("Joueur " + str(id) + " : je suis survivant et j'ai touché un épervier")
			ServerSocket.players_inputs_buffer[id] = Vector2(0, 0)
			role_changed.emit(id, ROLE_INFECTED)
			# Envoie d'un signal réceptionné par l'Arène pour mettre à jour son compteur de joueurs
			player_infected.emit(body.id, id)
		elif role == ROLE_SPARROWHAWK and body.role == ROLE_SURVIVOR:
			# Le joueur cible devient infecté
			#print("Joueur " + str(id) + " : je suis épervier et j'ai touché un survivant")
			ServerSocket.players_inputs_buffer[body.id] = Vector2(0, 0)
			body.role_changed.emit(body.id, ROLE_INFECTED)
			# Envoie d'un signal réceptionné par l'Arène pour mettre à jour son compteur de joueurs
			player_infected.emit(id, body.id)
