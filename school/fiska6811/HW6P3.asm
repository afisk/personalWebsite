.orig x3000



;compare 2 integers from DATA1 and DATA2
;Smaller of 2 integer is stored in DATA3

LD R0, DATA1
LD R1, DATA2

NOT R3, R1
ADD R3, R3, R0
BRp NEXT  ;R0 is bigger
ADD R2, R2, R1
BR END

NEXT ADD R2, R2, R0

END ST R2, DATA3
HALT


DATA1:x3050
DATA2:x3051
DATA3:x3052