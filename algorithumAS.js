import sys
import threading
print (sys.argv)
# CONSTANTAS
# defualtValues = [1,100,3,5]
# for value in defualtValues:
try:
    t = int(sys.argv[1])
except ValueError:
    t = 1
except IndexError:
    t = 1
try:
    N = int(sys.argv[2])
except ValueError:
    N = 120
except IndexError:
    N = 120
try:
    v = int(sys.argv[3])
except ValueError:
    v = 3
except IndexError:
    v = 3
#Ask time
try:
    a = int(sys.argv[4])
except ValueError:
    a = 5
except IndexError:
    a = 5
D = round((t*N)/v,0)
#Ask time count
u = 0
r = 0
w = 0
u_lock = threading.Lock()
print(t,N,v,a,D)
#VARIABLES
#Current Advancement
c = []
#Volunteer Work
z = []
za = []
wi = []
for i in range(0,v):
    c.append(int(0))
    z.append(int(D))
    za.append(int(D))
    wi.append(int(0))
print(c,za)
#START SYSTEM
def f():
    global u,r,w,c,z
    with u_lock:
        for i in range(0,len(c)):
            last = int(c[i])
            c[i] = int(input("How many tasks have you done? [" + str(c[i]) +"] "))
            while(last > int(c[i])):
                c[i] = int(input("How many tasks have you done? [" + str(c[i]) +"] "))
            try:
                wi = (c[i]/r)
            except ZeroDivisionError:
                wi = 0
            z[i] = z[i] + last - c[i]
        u += 1
        r = (a*u)/t
        w = (len(c)*r) - sum(c)
        tempSum = sum(z)
        for i in range(0,len(za)):
            za[i] = tempSum/len(za)
        # for i in range(0,len(za)):
        #     za[i] = z[i] - c[i]
        # for i in range(0,v):
        #     za[i] = sum(za)/len(za)
        print("\nVolunteer work before Algo: " + str(z) + "\nCurrent Advancement: " + str(c) + "\nVolunteer work after Algo: " + str(za) + "\nAsk time count: " + str(u) + "\nReal Advancement: " +
        str(r) + "\nAsk time: " + str(a) + "\nTime per task: " + str(t) + "\nWork available: " + str(w))
        z = za
        if (sum(z) == 0):
            print("Your done!!")
            return
        threading.Timer((a*1), f).start()

# if (D > 0):
#     u = u + 1
f()
