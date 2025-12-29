interface PatientDemographicsProps {
  name?: string
  age?: number
  sex?: string
  occupation?: string
  maritalStatus?: string
}

export function PatientDemographics({
  name,
  age,
  sex,
  occupation,
  maritalStatus,
}: PatientDemographicsProps) {
  return (
    <div className="flex gap-6 text-sm text-gray-700 mb-6">
      {name && <span>Name: {name}</span>}
      {age && <span>Age: {age}yrs</span>}
      {sex && <span>Sex: {sex}</span>}
      {occupation && <span>Occupation: {occupation}</span>}
      {maritalStatus && <span>Marital Status: {maritalStatus}</span>}
    </div>
  )
}

