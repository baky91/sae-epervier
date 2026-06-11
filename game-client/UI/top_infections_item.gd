class_name TopInfectionsItem extends HBoxContainer

@onready var label_rank: Label = $Rank
@onready var label_name: Label = $Name
@onready var label_score: Label = $Score

func set_values(rank: int, p_name: String, infections: int) -> void:
	label_rank.text = "#" + str(rank)
	label_name.text = p_name
	label_score.text = str(infections)
