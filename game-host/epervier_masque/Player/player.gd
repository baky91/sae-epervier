class_name Player extends CharacterBody2D

const COLOR_BLUE = Color(0.231, 0.51, 0.965, 1.0)  # Survivant
const COLOR_GRAY = Color(0.612, 0.639, 0.686, 1.0) # Infecté
const COLOR_RED = Color(0.937, 0.267, 0.267, 1.0)  # Epervier

enum Role {
	SURVIVOR,
	INFECTED,
	SPARROWHAWK
}

var id: int
var speed: int = 300
var direction: Vector2 = Vector2.ZERO
var role: Role

func _physics_process(_delta: float) -> void:
	velocity = direction * speed
	move_and_slide()

func set_color(color: Color):
	MeshInstance2D.mesh.material.albedo_color = color

	
