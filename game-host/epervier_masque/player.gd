class_name Player extends CharacterBody2D

var _id: int
var _speed: int = 300
var _direction: Vector2 = Vector2.ZERO	

func _physics_process(delta: float) -> void:
	velocity = _direction * _speed
	move_and_slide()
